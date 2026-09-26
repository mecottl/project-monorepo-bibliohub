export const EMAIL_SERVICE = 'EMAIL_SERVICE';

export interface EmailMensaje {
  para: string;
  asunto: string;
  texto: string;
}

export interface EmailService {
  enviar(mensaje: EmailMensaje): Promise<void>;
}
