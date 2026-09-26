import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from '../entities/configuracion.entity';

const TTL_CACHE_MS = 30_000;

@Injectable()
export class ConfiguracionService {
  private readonly cache = new Map<string, { valor: string | null; expira: number }>();

  constructor(
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
  ) {}

  async findAll(): Promise<Configuracion[]> {
    return this.configuracionRepository.find({ order: { clave: 'ASC' } });
  }

  // Fuente única de lectura para el resto de módulos. Sin `porDefecto`, un parámetro
  // inexistente es un error; con `porDefecto` se devuelve ese valor. Caché corta que se
  // invalida al editar (las funciones SQL leen la tabla directamente, no pasan por aquí).
  async valor(clave: string): Promise<string | null> {
    const hit = this.cache.get(clave);
    if (hit && hit.expira > Date.now()) return hit.valor;
    const fila = await this.configuracionRepository.findOne({ where: { clave } });
    const valor = fila?.valor ?? null;
    this.cache.set(clave, { valor, expira: Date.now() + TTL_CACHE_MS });
    return valor;
  }

  async valorNumerico(clave: string, porDefecto?: number): Promise<number> {
    const valor = await this.valor(clave);
    if (valor === null) {
      if (porDefecto !== undefined) return porDefecto;
      throw new BadRequestException(`Falta el parámetro de configuración "${clave}"`);
    }
    const numero = Number(valor);
    if (Number.isNaN(numero)) {
      throw new BadRequestException(`El parámetro de configuración "${clave}" no es numérico`);
    }
    return numero;
  }

  async update(clave: string, valor: string): Promise<Configuracion> {
    const configuracion = await this.configuracionRepository.findOne({ where: { clave } });

    if (!configuracion) {
      throw new NotFoundException(`No existe el parámetro de configuración "${clave}"`);
    }

    this.validarValor(valor, configuracion.tipoDato);

    configuracion.valor = valor;
    configuracion.updatedAt = new Date();
    const guardado = await this.configuracionRepository.save(configuracion);
    this.cache.delete(clave);
    return guardado;
  }

  // La tabla configuracion no tiene CHECK constraint sobre el contenido de "valor"
  // (es texto libre), solo sobre tipo_dato — validamos aquí antes de guardar para
  // no dejar, por ejemplo, "abc" en un parámetro numérico que las funciones SQL
  // de POS/pedidos leen en tiempo de ejecución.
  private validarValor(valor: string, tipoDato: Configuracion['tipoDato']): void {
    switch (tipoDato) {
      case 'integer':
        if (!/^-?\d+$/.test(valor)) {
          throw new BadRequestException(`El valor debe ser un entero (recibido: "${valor}")`);
        }
        break;
      case 'numeric':
        if (Number.isNaN(Number(valor))) {
          throw new BadRequestException(`El valor debe ser numérico (recibido: "${valor}")`);
        }
        break;
      case 'boolean':
        if (!['true', 'false'].includes(valor)) {
          throw new BadRequestException(`El valor debe ser "true" o "false" (recibido: "${valor}")`);
        }
        break;
      case 'text':
      default:
        break;
    }
  }
}
