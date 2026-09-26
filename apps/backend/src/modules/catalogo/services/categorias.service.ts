import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../entities/categoria.entity';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';
import { asignarDefinidos } from '@common/asignar-definidos';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async findAllCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

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
}
