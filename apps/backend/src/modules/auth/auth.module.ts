import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { SesionesLimpiezaService } from './services/sesiones-limpieza.service';
import { RecuperacionService } from './services/recuperacion.service';
import { RecuperacionPassword } from './entities/recuperacion-password.entity';
import { EMAIL_SERVICE, EmailService } from '@infra/email/email.interface';
import { ConsoleEmailService } from '@infra/email/console-email.service';
import { SmtpEmailService } from '@infra/email/smtp-email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';
import { LogAcceso } from './entities/log-acceso.entity';
import { Sesion } from './entities/sesion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente, Empleado, LogAcceso, Sesion, RecuperacionPassword]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '8h',
          ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RecuperacionService,
    SesionesLimpiezaService,
    {
      provide: EMAIL_SERVICE,
      useFactory: (): EmailService =>
        process.env.EMAIL_DRIVER === 'smtp' ? new SmtpEmailService() : new ConsoleEmailService(),
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
