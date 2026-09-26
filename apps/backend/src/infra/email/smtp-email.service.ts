import { createTransport, Transporter } from 'nodemailer';
import { EmailMensaje, EmailService } from './email.interface';

export class SmtpEmailService implements EmailService {
  private readonly transporter: Transporter;

  constructor() {
    const puerto = Number(process.env.SMTP_PORT ?? 587);
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async enviar(mensaje: EmailMensaje): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: mensaje.para,
      subject: mensaje.asunto,
      text: mensaje.texto,
    });
  }
}
