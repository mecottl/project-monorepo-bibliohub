import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { CrowdCanvasComponent } from '../../components/crowd-canvas/crowd-canvas.component';

// Hoja de sprites (public/hoja-personajes.webp): 8 columnas x 8 filas de escritores y personajes, fondo transparente (fuentes en design/personajes).
const HOJA_PERSONAJES = '/hoja-personajes.webp';

@Component({
  selector: 'app-landing',
  imports: [LogoComponent, CrowdCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="landing" [class.is-saliendo]="saliendo()">
      <div class="landing__mundo">
      <section class="landing__hero">
        <div class="landing__marca">
          <app-logo />
          <span class="font-display">BiblioHub</span>
        </div>
        <h1 class="font-display">Tu próxima historia empieza aquí</h1>
        <a href="/inicio" class="btn-primary" (click)="entrar($event)">Comencemos nuestra aventura</a>
      </section>

      <app-crowd-canvas [src]="hoja" [columnas]="8" [filas]="8" [personas]="57" [lentitud]="2.2" [altoPct]="62" [escala]="0.92" [profundidad]="70" [bajada]="35" />
      </div>

      <footer class="landing__pie">
        Skiper UI
      </footer>
    </main>
  `,
  styles: `
    .landing {
      position: relative;
      min-height: 100vh;
      min-height: 100dvh;
      overflow: hidden;
      background: var(--color-crema);
      color: var(--color-negro-suave);
    }
    .landing__marca {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      color: inherit;
      text-decoration: none;
    }
    .landing__marca app-logo { --logo-size: 52px; }
    .landing__hero {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      padding: clamp(72px, 21vh, 230px) 16px 0;
    }
    .landing h1 {
      margin: 0;
      max-width: 16ch;
      font-size: clamp(36px, 7vw, 76px);
      line-height: 1.05;
    }
    .landing__hero .btn-primary { width: auto; text-decoration: none; font-size: 16px; padding: 14px 28px; }
    /* Al pulsar el botón la cámara entra por dentro del logo (efecto Glyph Portal): el "mundo" se escala desde
       el mayor parche sólido del logo hasta que solo se ve su tinta y de ahí se pasa directo al catálogo. */
    .landing__mundo { position: relative; min-height: inherit; transform-origin: var(--zx, 50%) var(--zy, 30%); }
    .is-saliendo .landing__mundo {
      /* El parche viaja al centro de la pantalla mientras crece: así cubre toda la vista. */
      transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(var(--zs, 1));
      transition: transform 1.05s cubic-bezier(0.62, 0, 0.9, 0.45);
    }
    .is-saliendo .landing__hero h1, .is-saliendo .landing__hero .btn-primary { opacity: 0; transition: opacity 0.3s ease; }
    @media (prefers-reduced-motion: reduce) {
      .landing__mundo { transition: none !important; }
    }
    .landing__pie {
      position: absolute;
      z-index: 2;
      bottom: 2px;
      right: 8px;
      font-family: var(--font-ui);
      font-size: 9px;
      color: var(--color-negro-suave);
      opacity: 0.3;
    }
  `
})
export class LandingPage {
  private readonly router = inject(Router);
  readonly hoja = HOJA_PERSONAJES;
  saliendo = signal(false);

  // Sin scroll: el botón lanza el zoom por dentro del logo y, al llenar la pantalla, pasa al catálogo.
  entrar(evento: MouseEvent): void {
    evento.preventDefault();
    if (this.saliendo()) return;
    const landing = (evento.currentTarget as HTMLElement).closest<HTMLElement>('.landing')!;
    const destino = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : this.puntoDeEntrada(landing);
    if (!destino) {
      this.router.navigate(['/inicio']);
      return;
    }
    landing.style.setProperty('--zx', `${destino.x}px`);
    landing.style.setProperty('--zy', `${destino.y}px`);
    landing.style.setProperty('--zs', String(destino.escala));
    landing.style.setProperty('--tx', `${innerWidth / 2 - destino.x}px`);
    landing.style.setProperty('--ty', `${innerHeight / 2 - destino.y}px`);
    this.saliendo.set(true);
    setTimeout(() => this.irAlCatalogo(), 1000);
  }

  // Disuelve la vista de tinta hacia el catálogo (View Transitions); sin soporte, navega directo.
  private irAlCatalogo(): void {
    const navegar = async () => {
      await this.router.navigate(['/inicio']);
      await new Promise((resolver) => setTimeout(resolver, 60));
    };
    const transicion = (document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown }).startViewTransition;
    if (transicion) transicion.call(document, navegar);
    else navegar();
  }

  // Centro del mayor cuadrado sólido del logo (en coordenadas de la landing) y la escala con la que ese parche
  // llena la pantalla.
  private puntoDeEntrada(landing: HTMLElement): { x: number; y: number; escala: number } | null {
    const imagen = landing.querySelector<HTMLImageElement>('.landing__marca img');
    if (!imagen?.naturalWidth) return null;

    // Se analiza a resolución reducida: cuenta como tinta lo opaco y oscuro (el logo es morado sobre fondo claro).
    const tope = 256;
    const factor = Math.min(1, tope / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const ancho = Math.round(imagen.naturalWidth * factor);
    const alto = Math.round(imagen.naturalHeight * factor);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d', { willReadFrequently: true });
    if (!contexto) return null;
    contexto.drawImage(imagen, 0, 0, ancho, alto);
    const pixeles = contexto.getImageData(0, 0, ancho, alto).data;

    // Mayor cuadrado de tinta en tiempo lineal (programación dinámica).
    const filas = new Uint16Array(ancho + 1);
    let lado = 0, bx = 0, by = 0;
    for (let y = 0; y < alto; y++) {
      let diagonal = 0;
      for (let x = 0; x < ancho; x++) {
        const i = (y * ancho + x) * 4;
        const tinta = pixeles[i + 3] > 200 && pixeles[i] + pixeles[i + 1] + pixeles[i + 2] < 420;
        const arriba = filas[x + 1];
        filas[x + 1] = tinta ? Math.min(arriba, filas[x], diagonal) + 1 : 0;
        diagonal = arriba;
        if (filas[x + 1] > lado) { lado = filas[x + 1]; bx = x; by = y; }
      }
    }
    if (lado < 3) return null;

    const caja = imagen.getBoundingClientRect();
    const base = landing.getBoundingClientRect();
    const px = caja.width / ancho;
    const radio = (lado / 2 - 1) * px;
    return {
      x: caja.left - base.left + (bx + 1 - lado / 2) * px,
      y: caja.top - base.top + (by + 1 - lado / 2) * px,
      escala: Math.hypot(innerWidth, innerHeight) / 2 / (radio * 0.9)
    };
  }
}
