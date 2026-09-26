import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pedido-confirmado',
  imports: [RouterLink],
  templateUrl: './pedido-confirmado.page.html',
  styleUrl: './pedido-confirmado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoConfirmadoPage {}
