import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CuentaService, PuntosCuenta } from '@domain/cuenta/cuenta.service';

@Component({
  selector: 'app-cuenta-puntos',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Mis puntos</h1>

      @if (datos(); as datos) {
        <div class="cuenta-card puntos-saldo">
          <span class="cuenta-hint">Saldo disponible</span>
          <strong>{{ datos.saldo }}</strong>
          <span class="cuenta-hint">
            Ganas 1 punto por cada \${{ datos.pesosPorPunto }} de compra y cada punto equivale a
            \${{ datos.pesosPorPuntoCanjeado }} de descuento.
          </span>
        </div>

        <div class="cuenta-card">
          <h2 class="font-display">Movimientos</h2>
          @for (m of datos.movimientos; track m.id) {
            <div class="puntos-mov">
              <span>
                {{ m.concepto ?? (m.tipo === 'ganado' ? 'Puntos ganados' : 'Puntos canjeados') }}
                <small class="cuenta-hint"
                  >· {{ m.canal === 'pos' ? 'Tienda' : 'En línea' }} ·
                  {{ m.fecha | date: 'dd/MM/yyyy' }}</small
                >
              </span>
              <span [class]="m.tipo">{{ m.tipo === 'ganado' ? '+' : '−' }}{{ m.puntos }}</span>
            </div>
          } @empty {
            <p class="cuenta-hint">Aún no tienes movimientos.</p>
          }
        </div>
      } @else {
        <p class="cuenta-hint">Cargando...</p>
      }
    </section>
  `,
})
export class PuntosPage {
  datos = signal<PuntosCuenta | null>(null);

  constructor() {
    inject(CuentaService)
      .puntos()
      .subscribe((datos) => this.datos.set(datos));
  }
}
