import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Cliente } from '../database/entities/cliente.entity';
import { Empleado } from '../database/entities/empleado.entity';
import { Sesion } from '../database/entities/sesion.entity';
import { LogAcceso } from '../database/entities/log-acceso.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'LibreriaV1',
    entities: [Cliente, Empleado, Sesion, LogAcceso],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  }),
);
