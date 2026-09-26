import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Sesion } from '../../database/entities/sesion.entity';

const CADA_MS = 60 * 60 * 1000;

// La tabla `sesion` recibe una fila por login y nada la purgaba: se borran las vencidas al arrancar y cada hora.
@Injectable()
export class SesionesLimpiezaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SesionesLimpiezaService.name);
  private temporizador?: NodeJS.Timeout;

  constructor(@InjectRepository(Sesion) private readonly sesionRepo: Repository<Sesion>) {}

  onModuleInit(): void {
    void this.limpiar();
    this.temporizador = setInterval(() => void this.limpiar(), CADA_MS);
    this.temporizador.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.temporizador);
  }

  async limpiar(): Promise<number> {
    try {
      const { affected } = await this.sesionRepo.delete({ expiraEn: LessThan(new Date()) });
      if (affected) this.logger.log(`Sesiones vencidas eliminadas: ${affected}`);
      return affected ?? 0;
    } catch (error) {
      this.logger.error('No se pudieron limpiar las sesiones vencidas', error as Error);
      return 0;
    }
  }
}
