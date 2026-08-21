import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Libro } from '../../../database/entities/libro.entity';
import { QueryLibroDto } from '../dto/query-libro.dto';
import { PaginatedLibros } from '../interfaces/catalogo.interface';
import { CreateLibroDto } from '../dto/create-libro.dto';
import { LibroAutor } from '../../../database/entities/libro-autor.entity';
import { UpdateLibroDto } from '../dto/update-libro.dto';
import { Categoria } from '../../../database/entities/categoria.entity';
import { Editorial } from '../../../database/entities/editorial.entity';
import { Autor } from '../../../database/entities/autor.entity';

@Injectable()
export class CatalogoService {
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
  ) {}

  async findAll(query: QueryLibroDto): Promise<PaginatedLibros> {
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
      qb.andWhere('libro.titulo ILIKE :titulo', { titulo: `%${titulo}%` });
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
      data,
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

  async findStockBajo(): Promise<any[]> {
    return this.dataSource.query('SELECT * FROM alerta_stock_bajo');
  }

  async findOne(id: string): Promise<Libro> {
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

  async create(dto: CreateLibroDto): Promise<Libro> {
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

      return libroCompleto;
    });
  }

  async update(id: string, dto: UpdateLibroDto): Promise<Libro> {
    const libro = await this.libroRepository.findOne({ where: { id } });

    if (!libro) {
      throw new NotFoundException(`Libro con id ${id} no encontrado`);
    }

    await this.libroRepository.update(id, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const libro = await this.libroRepository.findOne({ where: { id } });

    if (!libro) {
      throw new NotFoundException(`Libro con id ${id} no encontrado`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ventasAsociadas = await this.dataSource
      .createQueryBuilder()
      .select('1')
      .from('detalle_venta', 'dv')
      .where('dv.libro_id = :id', { id })
      .limit(1)
      .getRawOne();

    if (ventasAsociadas) {
      libro.activo = false;
      libro.updatedAt = new Date();
      await this.libroRepository.save(libro);
      return {
        message:
          'Libro tiene ventas asociadas: se marcó como inactivo (baja lógica), no se eliminó físicamente.',
      };
    }

    await this.libroRepository.remove(libro);
    return { message: 'Libro eliminado físicamente (sin ventas asociadas).' };
  }
}
