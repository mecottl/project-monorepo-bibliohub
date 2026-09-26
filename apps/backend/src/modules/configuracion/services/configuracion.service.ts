import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from '../entities/configuracion.entity';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
  ) {}

  async findAll(): Promise<Configuracion[]> {
    return this.configuracionRepository.find({ order: { clave: 'ASC' } });
  }

  async update(clave: string, valor: string): Promise<Configuracion> {
    const configuracion = await this.configuracionRepository.findOne({ where: { clave } });

    if (!configuracion) {
      throw new NotFoundException(`No existe el parámetro de configuración "${clave}"`);
    }

    this.validarValor(valor, configuracion.tipoDato);

    configuracion.valor = valor;
    configuracion.updatedAt = new Date();
    return this.configuracionRepository.save(configuracion);
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
