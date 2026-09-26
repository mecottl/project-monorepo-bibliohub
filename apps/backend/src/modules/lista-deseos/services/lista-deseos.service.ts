import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListaDeseos } from '../entities/lista-deseos.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';

@Injectable()
export class ListaDeseosService {
  constructor(
    @InjectRepository(ListaDeseos)
    private readonly listaRepository: Repository<ListaDeseos>,
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
  ) {}

  // Misma forma que catalogo (imagenUrl en vez de imagenKey) para reusar
  // book-card en el frontend sin adaptar nada.
  async listar(clienteId: string, baseUrl: string) {
    const filas = await this.listaRepository.find({
      where: { clienteId },
      relations: ['libro', 'libro.editorial', 'libro.categoria', 'libro.libroAutores', 'libro.libroAutores.autor'],
      order: { createdAt: 'DESC' },
    });

    return filas
      .filter((fila) => fila.libro.activo)
      .map(({ libro }) => {
        const { imagenKey, ...resto } = libro;
        return { ...resto, imagenUrl: imagenKey ? `${baseUrl}/uploads/portadas/${imagenKey}` : null };
      });
  }

  async ids(clienteId: string): Promise<string[]> {
    const filas = await this.listaRepository.find({ where: { clienteId } });
    return filas.map((fila) => fila.libroId);
  }

  async agregar(clienteId: string, libroId: string): Promise<{ libroId: string }> {
    const libro = await this.libroRepository.findOne({ where: { id: libroId } });
    if (!libro || !libro.activo) {
      throw new NotFoundException(`Libro con id ${libroId} no encontrado`);
    }

    const existente = await this.listaRepository.findOne({ where: { clienteId, libroId } });
    if (!existente) {
      await this.listaRepository.save(this.listaRepository.create({ clienteId, libroId }));
    }
    return { libroId };
  }

  async quitar(clienteId: string, libroId: string): Promise<{ libroId: string }> {
    await this.listaRepository.delete({ clienteId, libroId });
    return { libroId };
  }
}
