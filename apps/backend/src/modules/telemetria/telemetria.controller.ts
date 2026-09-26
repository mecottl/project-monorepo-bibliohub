import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/auth/public.decorator';
import { ReportarErrorDto } from './dto/reportar-error.dto';

// Recibe los errores no controlados del frontend y los deja en el log estructurado del backend
// (mismo pipeline que el resto). Público y con tope bajo por IP; el cuerpo está acotado por el DTO.
@ApiTags('telemetria')
@Controller('telemetria')
export class TelemetriaController {
  private readonly logger = new Logger('ErrorFrontend');

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  @Post('errores')
  reportar(@Body() dto: ReportarErrorDto): void {
    this.logger.error(dto.mensaje, dto.stack ?? '', dto.url ?? '');
  }
}
