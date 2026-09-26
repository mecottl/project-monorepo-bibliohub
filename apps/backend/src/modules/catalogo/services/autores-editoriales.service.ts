import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Editorial } from '../entities/editorial.entity';
import { Autor } from '../entities/autor.entity';
import { CreateAutorDto } from '../dto/create-autor.dto';
import { UpdateAutorDto } from '../dto/update-autor.dto';
import { CreateEditorialDto } from '../dto/create-editorial.dto';
import { UpdateEditorialDto } from '../dto/update-editorial.dto';
import { asignarDefinidos } from '@common/asignar-definidos';

@Injectable()
export class AutoresEditorialesService {
  constructor(
    @InjectRepository(Autor)
    private readonly autorRepository: Repository<Autor>,
    @InjectRepository(Editorial)
    private readonly editorialRepository: Repository<Editorial>,
  ) {}

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
}
