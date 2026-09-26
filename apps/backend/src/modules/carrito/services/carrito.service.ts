import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrito } from '../entities/carrito.entity';
import { ItemCarrito } from '../entities/item-carrito.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { AgregarItemCarritoDto } from '../dto/agregar-item-carrito.dto';
import { CarritoConItems } from '../interfaces/carrito.interface';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    @InjectRepository(ItemCarrito)
    private readonly itemRepository: Repository<ItemCarrito>,
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
  ) {}

  async obtenerCarrito(clienteId: string, baseUrl: string): Promise<CarritoConItems> {
    const carrito = await this.obtenerOCrearCarrito(clienteId);
    return this.mapCarrito(carrito.id, baseUrl);
  }

  async agregarItem(
    clienteId: string,
    dto: AgregarItemCarritoDto,
    baseUrl: string,
  ): Promise<CarritoConItems> {
    const libro = await this.libroRepository.findOne({ where: { id: dto.libroId } });
    if (!libro || !libro.activo) {
      throw new NotFoundException(`Libro con id ${dto.libroId} no encontrado`);
    }

    const carrito = await this.obtenerOCrearCarrito(clienteId);
    const cantidadASumar = dto.cantidad ?? 1;

    const existente = await this.itemRepository.findOne({
      where: { carritoId: carrito.id, libroId: dto.libroId },
    });

    const cantidadFinal = (existente?.cantidad ?? 0) + cantidadASumar;
    this.validarStock(libro, cantidadFinal);

    if (existente) {
      await this.itemRepository.update(existente.id, { cantidad: cantidadFinal });
    } else {
      await this.itemRepository.save(
        this.itemRepository.create({
          carritoId: carrito.id,
          libroId: dto.libroId,
          cantidad: cantidadFinal,
        }),
      );
    }

    return this.mapCarrito(carrito.id, baseUrl);
  }

  async actualizarItem(
    clienteId: string,
    libroId: string,
    cantidad: number,
    baseUrl: string,
  ): Promise<CarritoConItems> {
    const carrito = await this.obtenerOCrearCarrito(clienteId);
    const item = await this.itemRepository.findOne({ where: { carritoId: carrito.id, libroId } });

    if (!item) {
      throw new NotFoundException('Ese libro no está en el carrito');
    }

    if (cantidad === 0) {
      await this.itemRepository.remove(item);
    } else {
      const libro = await this.libroRepository.findOne({ where: { id: libroId } });
      if (!libro) {
        throw new NotFoundException(`Libro con id ${libroId} no encontrado`);
      }
      this.validarStock(libro, cantidad);
      await this.itemRepository.update(item.id, { cantidad });
    }

    return this.mapCarrito(carrito.id, baseUrl);
  }

  async quitarItem(clienteId: string, libroId: string, baseUrl: string): Promise<CarritoConItems> {
    const carrito = await this.obtenerOCrearCarrito(clienteId);
    await this.itemRepository.delete({ carritoId: carrito.id, libroId });
    return this.mapCarrito(carrito.id, baseUrl);
  }

  async vaciarCarrito(clienteId: string, baseUrl: string): Promise<CarritoConItems> {
    const carrito = await this.obtenerOCrearCarrito(clienteId);
    await this.itemRepository.delete({ carritoId: carrito.id });
    return this.mapCarrito(carrito.id, baseUrl);
  }

  private validarStock(libro: Libro, cantidad: number): void {
    if (cantidad > libro.stockActual) {
      throw new BadRequestException(
        `Solo hay ${libro.stockActual} unidades disponibles de "${libro.titulo}"`,
      );
    }
  }

  private async obtenerOCrearCarrito(clienteId: string): Promise<Carrito> {
    let carrito = await this.carritoRepository.findOne({ where: { clienteId } });
    if (!carrito) {
      carrito = await this.carritoRepository.save(this.carritoRepository.create({ clienteId }));
    }
    return carrito;
  }

  private async mapCarrito(carritoId: string, baseUrl: string): Promise<CarritoConItems> {
    const items = await this.itemRepository.find({
      where: { carritoId },
      relations: ['libro'],
      order: { id: 'ASC' },
    });

    const itemsMapeados = items.map((item) => ({
      id: item.id,
      libroId: item.libroId,
      cantidad: item.cantidad,
      libro: {
        id: item.libro.id,
        titulo: item.libro.titulo,
        precioVenta: item.libro.precioVenta,
        stockActual: item.libro.stockActual,
        imagenUrl: item.libro.imagenKey
          ? `${baseUrl}/uploads/portadas/${item.libro.imagenKey}`
          : null,
      },
      subtotal: item.cantidad * Number(item.libro.precioVenta),
    }));

    return {
      id: carritoId,
      items: itemsMapeados,
      totalItems: itemsMapeados.reduce((acc, i) => acc + i.cantidad, 0),
      subtotal: itemsMapeados.reduce((acc, i) => acc + i.subtotal, 0),
    };
  }
}
