import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Libro } from '../../../database/entities/libro.entity';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { LibroConImagen, PaginatedLibros } from '../interfaces/catalogo.interface';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { LibroAutor } from '../../../database/entities/libro-autor.entity';
import { UpdateLibroDto } from '../dto/update-libro.dto';
import { Categoria } from '../../../database/entities/categoria.entity';
import { Editorial } from '../../../database/entities/editorial.entity';
import { Autor } from '../../../database/entities/autor.entity';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import type { StorageService } from '../storage/storage.interface';

@Injectable()
export class CatalogoService {
  // Tablas con FK ON DELETE RESTRICT hacia libro(id): un DELETE físico
  // fallaría con un error de base de datos si alguna tiene filas asociadas.
  private readonly TABLAS_CON_REFERENCIA_LIBRO = [
    'detalle_venta',
    'movimiento_inventario',
    'detalle_pedido_compra',
    'detalle_pedido_linea',
    'item_carrito',
  ];

  constructor(
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
    @InjectRepository(Autor)
    private readonly autorRepository: Repository<Autor>,
    @InjectRepository(Editorial)
    private readonly editorialRepository: Repository<Editorial>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    private readonly dataSource: DataSource,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: QueryLibroDto, baseUrl: string): Promise<PaginatedLibros> {
    const {
      titulo,
      autor,
      isbn,
      categoriaId,
      editorialId,
      page = 1,
      limit = 10,
    } = query;

    const qb: SelectQueryBuilder<Libro> = this.libroRepository
      .createQueryBuilder('libro')
      .leftJoinAndSelect('libro.editorial', 'editorial')
      .leftJoinAndSelect('libro.categoria', 'categoria')
      .leftJoinAndSelect('libro.libroAutores', 'libroAutores')
      .leftJoinAndSelect('libroAutores.autor', 'autorRelacion')
      .where('libro.activo = :activo', { activo: true });

    if (titulo) {
      // Búsqueda general: coincide por título, ISBN o nombre de autor.
      qb.andWhere(
        '(libro.titulo ILIKE :busqueda OR libro.isbn ILIKE :busqueda OR autorRelacion.nombre ILIKE :busqueda)',
        { busqueda: `%${titulo}%` },
      );
    }

    if (isbn) {
      qb.andWhere('libro.isbn = :isbn', { isbn });
    }

    if (categoriaId) {
      qb.andWhere('libro.categoriaId = :categoriaId', { categoriaId });
    }

    if (editorialId) {
      qb.andWhere('libro.editorialId = :editorialId', { editorialId });
    }

    if (autor) {
      qb.andWhere('autorRelacion.nombre ILIKE :autor', { autor: `%${autor}%` });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((libro) => this.mapLibro(libro, baseUrl)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllAutores(): Promise<Autor[]> {
    return this.autorRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findAllEditoriales(): Promise<Editorial[]> {
    return this.editorialRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findAllCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findStockBajo(): Promise<unknown[]> {
    return this.dataSource.query('SELECT * FROM alerta_stock_bajo');
  }

  async findOne(id: string, baseUrl: string): Promise<LibroConImagen> {
    const libro = await this.buscarLibroConRelaciones(id);
    return this.mapLibro(libro, baseUrl);
  }

  async create(dto: CreateLibroDto, baseUrl: string): Promise<LibroConImagen> {
    return this.dataSource.transaction(async (manager) => {
      const existente = await manager.findOne(Libro, {
        where: { isbn: dto.isbn },
      });
      if (existente) {
        throw new ConflictException(
          `Ya existe un libro con el ISBN ${dto.isbn}`,
        );
      }

      const libro = manager.create(Libro, {
        isbn: dto.isbn,
        titulo: dto.titulo,
        editorialId: dto.editorialId,
        categoriaId: dto.categoriaId,
        precioVenta: dto.precioVenta,
        precioCosto: dto.precioCosto,
        stockActual: dto.stockActual,
        stockMinimo: dto.stockMinimo ?? 5,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const libroGuardado = await manager.save(Libro, libro);

      if (dto.autores?.length) {
        const relaciones = dto.autores.map((a) =>
          manager.create(LibroAutor, {
            libroId: libroGuardado.id,
            autorId: a.autorId,
            rol: a.rol,
          }),
        );
        await manager.save(LibroAutor, relaciones);
      }

      const libroCompleto = await manager.findOne(Libro, {
        where: { id: libroGuardado.id },
        relations: [
          'editorial',
          'categoria',
          'libroAutores',
          'libroAutores.autor',
        ],
      });

      if (!libroCompleto) {
        throw new NotFoundException(
          'Error al recuperar el libro recién creado',
        );
      }

      return this.mapLibro(libroCompleto, baseUrl);
    });
  }

  async update(
    id: string,
    dto: UpdateLibroDto,
    baseUrl: string,
  ): Promise<LibroConImagen> {
    await this.buscarLibroSimple(id);

    await this.libroRepository.update(id, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.findOne(id, baseUrl);
  }

  async remove(id: string): Promise<{ message: string }> {
    const libro = await this.buscarLibroSimple(id);

    const tieneReferencias = await this.tieneRegistrosAsociados(id);

    if (tieneReferencias) {
      libro.activo = false;
      libro.updatedAt = new Date();
      await this.libroRepository.save(libro);
      return {
        message:
          'Libro tiene registros asociados (ventas, movimientos de inventario, pedidos o carritos): se marcó como inactivo (baja lógica), no se eliminó físicamente.',
      };
    }

    await this.libroRepository.remove(libro);
    return { message: 'Libro eliminado físicamente (sin registros asociados).' };
  }

  async actualizarPortada(
    id: string,
    archivo: Express.Multer.File,
    baseUrl: string,
  ): Promise<LibroConImagen> {
    const libro = await this.buscarLibroConRelaciones(id);

    if (libro.imagenKey) {
      await this.storageService.eliminar(libro.imagenKey);
    }

    libro.imagenKey = await this.storageService.guardar(archivo);
    libro.updatedAt = new Date();
    await this.libroRepository.save(libro);

    return this.mapLibro(libro, baseUrl);
  }

  async eliminarPortada(id: string, baseUrl: string): Promise<LibroConImagen> {
    const libro = await this.buscarLibroConRelaciones(id);

    if (libro.imagenKey) {
      await this.storageService.eliminar(libro.imagenKey);
    }

    libro.imagenKey = null;
    libro.updatedAt = new Date();
    await this.libroRepository.save(libro);

    return this.mapLibro(libro, baseUrl);
  }

  private async buscarLibroSimple(id: string): Promise<Libro> {
    const libro = await this.libroRepository.findOne({ where: { id } });

    if (!libro) {
      throw new NotFoundException(`Libro con id ${id} no encontrado`);
    }

    return libro;
  }

  private async buscarLibroConRelaciones(id: string): Promise<Libro> {
    const libro = await this.libroRepository
      .createQueryBuilder('libro')
      .leftJoinAndSelect('libro.editorial', 'editorial')
      .leftJoinAndSelect('libro.categoria', 'categoria')
      .leftJoinAndSelect('libro.libroAutores', 'libroAutores')
      .leftJoinAndSelect('libroAutores.autor', 'autorRelacion')
      .where('libro.id = :id', { id })
      .getOne();

    if (!libro) {
      throw new NotFoundException(`Libro con id ${id} no encontrado`);
    }

    return libro;
  }

  private mapLibro(libro: Libro, baseUrl: string): LibroConImagen {
    const { imagenKey, ...resto } = libro;
    return {
      ...resto,
      imagenUrl: imagenKey ? `${baseUrl}/uploads/portadas/${imagenKey}` : null,
    };
  }

  private async tieneRegistrosAsociados(libroId: string): Promise<boolean> {
    for (const tabla of this.TABLAS_CON_REFERENCIA_LIBRO) {
      const encontrado = await this.dataSource
        .createQueryBuilder()
        .select('1')
        .from(tabla, 't')
        .where('t.libro_id = :libroId', { libroId })
        .limit(1)
        .getRawOne();

      if (encontrado) {
        return true;
      }
    }
    return false;
  }
}
