import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent {
  open = input.required<boolean>();
  title = input('¿Estás seguro?');
  message = input('Esta acción no se puede deshacer.');
  confirmLabel = input('Confirmar');
  cancelLabel = input('Cancelar');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
