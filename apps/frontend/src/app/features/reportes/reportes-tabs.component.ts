import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-reportes-tabs',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs" aria-label="Secciones de reportes">
      <a routerLink="/reportes" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Resumen</a>
      <a routerLink="/reportes/historial" routerLinkActive="is-active">Historial de ventas</a>
    </nav>
  `,
  styles: `
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--color-beige); }
    .tabs a {
      padding: 10px 16px;
      font-family: var(--font-ui);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-gris-oscuro);
      text-decoration: none;
      border-bottom: 2px solid transparent;
    }
    .tabs a.is-active { color: var(--color-cafe-oscuro); border-bottom-color: var(--color-cafe-medio); }
  `
})
export class ReportesTabsComponent {}
