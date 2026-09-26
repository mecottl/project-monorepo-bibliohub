import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Libro } from '../entities/libro.entity';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { LibroConImagen, PaginatedLibros } from '../interfaces/catalogo.interface';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { LibroAutor } from '../entities/libro-autor.entity';
import { UpdateLibroDto } from '../dto/update-libro.dto';
import { Categoria } from '../entities/categoria.entity';
import { Editorial } from '../entities/editorial.entity';
import { Autor } from '../entities/autor.entity';
import { CreateAutorDto } from '../dto/create-autor.dto';
import { UpdateAutorDto } from '../dto/update-autor.dto';
import { CreateEditorialDto } from '../dto/create-editorial.dto';
import { UpdateEditorialDto } from '../dto/update-editorial.dto';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';
import { STORAGE_SERVICE } from '@infra/storage/storage.interface';
import type { StorageService } from '@infra/storage/storage.interface';
import { asignarDefinidos } from '@common/asignar-definidos';

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
      stockBajo,
      disponibles,
      precioMin,
      precioMax,
      orden,
      direccion = 'ASC',
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

    if (disponibles) {
      qb.andWhere('libro.stockActual > 0');
    }

    if (precioMin !== undefined) {
      qb.andWhere('libro.precioVenta >= :precioMin', { precioMin });
    }

    if (precioMax !== undefined) {
      qb.andWhere('libro.precioVenta <= :precioMax', { precioMax });
    }

    if (stockBajo) {
      qb.andWhere('libro.stockActual <= libro.stockMinimo');
    }

    // Columnas ordenables (lista blanca: nunca se interpola texto del cliente en el ORDER BY).
    if (orden) {
      qb.orderBy(`libro.${orden}`, direccion).addOrderBy('libro.id', 'ASC');
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
    return this.dataSource.query(`
      SELECT
        id,
        isbn,
        titulo,
        editorial,
        stock_actual AS "stockActual",
        stock_minimo AS "stockMinimo",
        unidades_faltantes AS "unidadesFaltantes"
      FROM alerta_stock_bajo
    `);
  }

  // --- Autores ---

  async createAutor(dto: CreateAutorDto): Promise<Autor> {
    const autor = this.autorRepository.create({ ...dto, activo: true });
    return this.autorRepository.save(autor);
  }

  async updateAutor(id: string, dto: UpdateAutorDto): Promise<Autor> {
    const autor = await this.buscarAutor(id);
    asignarDefinidos(autor, dto);
    return this.autorRepository.save(autor);
  }

  // Baja lógica: un autor puede estar referenciado desde libro_autor —
  // desactivar en vez de borrar evita violar la FK sin tener que revisar
  // referencias primero (a diferencia de libro, donde sí importa liberar
  // el registro físicamente cuando no tiene ventas asociadas).
  async removeAutor(id: string): Promise<{ message: string }> {
    const autor = await this.buscarAutor(id);
    autor.activo = false;
    await this.autorRepository.save(autor);
    return { message: 'Autor desactivado.' };
  }

  private async buscarAutor(id: string): Promise<Autor> {
    const autor = await this.autorRepository.findOne({ where: { id } });
    if (!autor) {
      throw new NotFoundException(`Autor con id ${id} no encontrado`);
    }
    return autor;
  }

  // --- Editoriales ---

  async createEditorial(dto: CreateEditorialDto): Promise<Editorial> {
    const editorial = this.editorialRepository.create({
      ...dto,
      activo: true,
      createdAt: new Date(),
    });
    return this.editorialRepository.save(editorial);
  }

  async updateEditorial(id: string, dto: UpdateEditorialDto): Promise<Editorial> {
    const editorial = await this.buscarEditorial(id);
    asignarDefinidos(editorial, dto);
    return this.editorialRepository.save(editorial);
  }

  async removeEditorial(id: string): Promise<{ message: string }> {
    const editorial = await this.buscarEditorial(id);
    editorial.activo = false;
    await this.editorialRepository.save(editorial);
    return { message: 'Editorial desactivada.' };
  }

  private async buscarEditorial(id: string): Promise<Editorial> {
    const editorial = await this.editorialRepository.findOne({ where: { id } });
    if (!editorial) {
      throw new NotFoundException(`Editorial con id ${id} no encontrada`);
    }
    return editorial;
  }

  // --- Categorías ---

  async createCategoria(dto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = this.categoriaRepository.create({ ...dto, activo: true });
    return this.categoriaRepository.save(categoria);
  }

  async updateCategoria(id: string, dto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.buscarCategoria(id);
    asignarDefinidos(categoria, dto);
    return this.categoriaRepository.save(categoria);
  }

  async removeCategoria(id: string): Promise<{ message: string }> {
    const categoria = await this.buscarCategoria(id);
    categoria.activo = false;
    await this.categoriaRepository.save(categoria);
    return { message: 'Categoría desactivada.' };
  }

  private async buscarCategoria(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
    return categoria;
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
