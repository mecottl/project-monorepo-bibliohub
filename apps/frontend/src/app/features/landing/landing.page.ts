import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { CrowdCanvasComponent } from '../../shared/crowd-canvas/crowd-canvas.component';

// Hoja de sprites (public/hoja-personajes.webp): 8 columnas x 7 filas de escritores, fondo transparente (fuentes en design/personajes).
const HOJA_PERSONAJES = '/hoja-personajes.webp';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, LogoComponent, CrowdCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="landing">
      <section class="landing__hero">
        <div class="landing__marca">
          <app-logo />
          <span class="font-display">BiblioHub</span>
        </div>
        <h1 class="font-display">Tu próxima historia empieza aquí</h1>
        <a routerLink="/inicio" class="btn-primary">Comencemos nuestra aventura</a>
      </section>

      <app-crowd-canvas [src]="hoja" [columnas]="8" [filas]="7" [personas]="52" [lentitud]="2.2" [altoPct]="62" [escala]="0.92" [profundidad]="70" [bajada]="35" />

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
  readonly hoja = HOJA_PERSONAJES;
}
