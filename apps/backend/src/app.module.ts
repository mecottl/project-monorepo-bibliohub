import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import typeormConfig from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { InventarioModule } from './modules/inventory/inventario.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { EmpleadosModule } from './modules/empleados/empleados.module';
import { CarritoModule } from './modules/carrito/carrito.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { CuentaModule } from './modules/cuenta/cuenta.module';
import { ListaDeseosModule } from './modules/lista-deseos/lista-deseos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions =>
        config.get<TypeOrmModuleOptions>('database')!,
    }),
    // Tope general por IP; los endpoints de auth ponen uno más estricto con @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    CatalogoModule,
    InventarioModule,
    ClientesModule,
    VentasModule,
    ProveedoresModule,
    ReportesModule,
    ConfiguracionModule,
    EmpleadosModule,
    CarritoModule,
    PedidosModule,
    ListaDeseosModule,
    CuentaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
