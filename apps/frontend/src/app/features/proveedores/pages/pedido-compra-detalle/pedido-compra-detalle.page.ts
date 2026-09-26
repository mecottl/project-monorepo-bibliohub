import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmModalComponent } from '@shared/ui/confirm-modal/confirm-modal.component';
import { ProveedoresService } from '../../services/proveedores.service';
import { EstadoPedidoCompra, PedidoCompra } from '../../models/pedido-compra.model';

@Component({
  selector: 'app-pedido-compra-detalle',
  imports: [RouterLink, DatePipe, ConfirmModalComponent],
  templateUrl: './pedido-compra-detalle.page.html',
  styleUrl: './pedido-compra-detalle.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoCompraDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly proveedoresService = inject(ProveedoresService);

  pedido = signal<PedidoCompra | null>(null);
  cargando = signal(true);
  errorMensaje = signal<string | null>(null);
  cantidadesRecibidas = signal<Record<string, number>>({});
  mostrarConfirmCancelar = signal(false);

  readonly etiquetasEstado: Record<EstadoPedidoCompra, string> = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    recibido_parcial: 'Recibido parcial',
    recibido: 'Recibido',
    cancelado: 'Cancelado',
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.cargar(id);
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.proveedoresService.obtenerPedido(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cantidadesRecibidas.set(
          Object.fromEntries((pedido.detalles ?? []).map((d) => [d.id, d.cantidadRecibida])),
        );
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  puedeRecibir(): boolean {
    const estado = this.pedido()?.estado;
    return estado === 'pendiente' || estado === 'enviado' || estado === 'recibido_parcial';
  }

  onCantidadChange(detalleId: string, valor: number): void {
    this.cantidadesRecibidas.update((actuales) => ({ ...actuales, [detalleId]: valor }));
  }

  registrarRecepcion(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    const items = (pedido.detalles ?? []).map((d) => ({
      detalleId: d.id,
      cantidadRecibida: this.cantidadesRecibidas()[d.id] ?? d.cantidadRecibida,
    }));

    this.errorMensaje.set(null);
    this.proveedoresService.recibirPedido(pedido.id, items).subscribe({
      next: (actualizado) => {
        this.pedido.set(actualizado);
        this.cantidadesRecibidas.set(
          Object.fromEntries((actualizado.detalles ?? []).map((d) => [d.id, d.cantidadRecibida])),
        );
      },
      error: (err) =>
        this.errorMensaje.set(err?.error?.message ?? 'No se pudo registrar la recepción.'),
    });
  }

  pedirCancelar(): void {
    this.mostrarConfirmCancelar.set(true);
  }

  confirmarCancelar(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    this.proveedoresService.cancelarPedido(pedido.id).subscribe({
      next: (actualizado) => {
        this.pedido.set(actualizado);
        this.mostrarConfirmCancelar.set(false);
      },
      error: (err) => {
        this.mostrarConfirmCancelar.set(false);
        this.errorMensaje.set(err?.error?.message ?? 'No se pudo cancelar el pedido.');
      },
    });
  }

  cancelarModalCancelar(): void {
    this.mostrarConfirmCancelar.set(false);
  }
}
