// Tipos para las variables de entorno inyectadas por @ngx-env/builder
// (ver .env / .env.production) y accedidas vía import.meta.env.
declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_API_BASE_URL: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
