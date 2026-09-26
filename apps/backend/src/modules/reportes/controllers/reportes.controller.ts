import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReportesService } from '../services/reportes.service';
import { QueryHistorialVentasDto } from '../dto/query-historial-ventas.dto';
import { QueryReporteVentasDto } from '../dto/query-reporte-ventas.dto';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Roles('admin')
  @Get('rendimiento-empleados')
  rendimientoEmpleados() {
    return this.reportesService.rendimientoEmpleados();
  }

  @Roles('admin')
  @Get('libros-mas-vendidos')
  librosMasVendidos() {
    return this.reportesService.librosMasVendidos();
  }

  @Roles('admin')
  @Get('historial-ventas')
  historialVentas(@Query() query: QueryHistorialVentasDto) {
    return this.reportesService.historialVentas(query);
  }

  @Roles('admin')
  @Get('ventas')
  ventasPorPeriodo(@Query() query: QueryReporteVentasDto) {
    return this.reportesService.ventasPorPeriodo(query.fechaDesde, query.fechaHasta);
  }
}
