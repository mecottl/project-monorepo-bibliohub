import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Sesion } from '../../database/entities/sesion.entity';
import type {
  JwtPayload,
  AuthenticatedUser,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Sesion)
    private readonly sesionRepo: Repository<Sesion>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(
    req: { headers: { authorization?: string } },
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    const raw = req.headers.authorization?.replace('Bearer ', '') ?? '';
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');

    const sesion = await this.sesionRepo.findOne({ where: { tokenHash } });

    if (!sesion || sesion.expiraEn < new Date()) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    return {
      id: payload.sub,
      tipo: payload.tipo,
      rol: payload.rol,
      nombre: payload.nombre,
    };
  }
}
