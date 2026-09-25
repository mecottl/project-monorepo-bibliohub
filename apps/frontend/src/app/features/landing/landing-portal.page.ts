import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../inventario/services/catalogo.service';
import { GlyphPortalComponent } from '../../shared/glyph-portal/glyph-portal.component';
import { LogoComponent } from '../../shared/logo/logo.component';

// Prueba de landing con Glyph Portal (21st.dev): las letras de la palabra son una ventana a un mosaico
// de portadas reales del catálogo; al hacer scroll la cámara entra por una letra y aparece el acceso al catálogo.
@Component({
  selector: 'app-landing-portal',
  imports: [RouterLink, GlyphPortalComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-glyph-portal
      class="portal"
      word="LIBROS"
      fontFamily='"Playfair Display", Georgia, serif'
      [fontWeight]="700"
      [scrollLength]="2.2"
    >
      <div gpBackground class="portal__mosaico">
        @for (url of portadas(); track $index) {
          <img [src]="url" alt="" loading="eager" />
        }
        <span class="portal__velo"></span>
      </div>

      <div gpFront class="portal__frente">
        <div class="portal__marca">
          <app-logo />
          <span class="font-display">BiblioHub</span>
        </div>
        <p class="portal__eyebrow">Tu próxima historia empieza aquí</p>
        <a routerLink="/inicio" class="btn-primary portal__boton">Comencemos nuestra aventura</a>
        <span class="portal__scroll">Desliza para acercarte ↓</span>
      </div>

      <div class="portal__contenido">
        <h2 class="font-display">Miles de historias te esperan</h2>
        <p>Explora el catálogo, guarda tus favoritos y acumula puntos con cada compra.</p>
        <a routerLink="/inicio" class="btn-primary portal__boton">Ir al catálogo</a>
      </div>
    </app-glyph-portal>
  `,
  styles: `
    :host { display: block; background: var(--color-crema); }
    .portal {
      --gp-paper: var(--color-crema);
      --gp-ink: var(--color-negro-suave);
      --gp-field: #2d1f14;
      --gp-foreground: #fff;
      font-family: var(--font-ui);
    }
    .portal__mosaico {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(70px, 9vw, 130px), 1fr));
      grid-auto-rows: clamp(105px, 13.5vw, 195px);
    }
    .portal__mosaico img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .portal__velo { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 12, 6, 0.25), rgba(20, 12, 6, 0.55)); }
    .portal__frente { position: absolute; inset: 0; }
    .portal__marca {
      position: absolute;
      top: clamp(20px, 4vw, 40px);
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
    }
    .portal__marca app-logo { --logo-size: 44px; }
    .portal__eyebrow {
      position: absolute;
      inset: auto 24px calc(100% - var(--gp-word-top, 35%) + 24px);
      margin: 0;
      text-align: center;
      font-size: 14px;
      color: var(--color-gris-oscuro);
    }
    .portal__boton { width: auto; text-decoration: none; font-size: 16px; padding: 14px 28px; }
    .portal__frente .portal__boton {
      position: absolute;
      top: calc(var(--gp-word-bottom, 50%) + 32px);
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .portal__scroll {
      position: absolute;
      inset: auto 24px 6%;
      text-align: center;
      font-size: 12px;
      color: var(--color-gris-oscuro);
    }
    .portal__contenido {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      max-width: 620px;
      margin: 0 auto;
      padding: 40px 32px;
      text-align: center;
      border-radius: 20px;
      background: rgba(20, 12, 6, 0.72);
      backdrop-filter: blur(6px);
    }
    .portal__contenido h2 { margin: 0; font-size: clamp(30px, 5vw, 52px); line-height: 1.1; }
    .portal__contenido p { margin: 0; font-size: 17px; opacity: 0.9; }
  `
})
export class LandingPortalPage {
  private readonly catalogo = inject(CatalogoService);
  private urls = signal<string[]>([]);

  // Portadas del catálogo, repetidas hasta llenar el mosaico.
  portadas = computed(() => {
    const base = this.urls();
    return base.length ? Array.from({ length: 120 }, (_, i) => base[i % base.length]) : [];
  });

  constructor() {
    this.catalogo.buscarLibros({ limit: 40 }).subscribe({
      next: (res) => this.urls.set(res.data.map((l) => l.imagenUrl).filter((u): u is string => !!u)),
      error: () => this.urls.set([])
    });
  }
}
