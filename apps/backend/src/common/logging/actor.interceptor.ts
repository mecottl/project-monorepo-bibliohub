import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { contextoPeticion } from './contexto';

// Copia el usuario autenticado (req.user, puesto por el guard JWT) al contexto de la petición.
@Injectable()
export class ActorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const store = contextoPeticion.getStore();
    const usuario = context.switchToHttp().getRequest().user;
    if (store && usuario) store.usuario = usuario;
    return next.handle();
  }
}
