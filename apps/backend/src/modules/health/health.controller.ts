import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '@common/auth/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  // Para el balanceador/hosting: 200 si la base responde, 503 si no. No expone secretos ni versiones.
  @Public()
  @SkipThrottle()
  @Get()
  async estado() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'caida' });
    }
    return {
      status: 'ok',
      db: 'ok',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configurado' : 'sin configurar',
      uptimeSegundos: Math.round(process.uptime()),
    };
  }
}
