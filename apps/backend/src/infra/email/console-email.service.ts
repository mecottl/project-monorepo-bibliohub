import { Logger } from '@nestjs/common';
import { EmailMensaje, EmailService } from './email.interface';

// Driver de desarrollo: no envía nada, imprime el correo en el log del backend.
export class ConsoleEmailService implements EmailService {
  private readonly logger = new Logger('Email');

  enviar(mensaje: EmailMensaje): Promise<void> {
    this.logger.log(`Para: ${mensaje.para} | ${mensaje.asunto}\n${mensaje.texto}`);
    return Promise.resolve();
  }
}
