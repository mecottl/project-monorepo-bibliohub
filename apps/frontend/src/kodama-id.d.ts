// El paquete kodama-id 1.0.0 publica "exports" apuntando a src/ (no incluido), así que
// tsconfig.json lo mapea a dist/core/index.js y aquí se declara la parte que usamos.
declare module 'kodama-id' {
  export function createKodama(options: {
    name: string;
    size?: number;
    animations?: string[];
  }): { svg: string };
}
