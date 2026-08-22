import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusBadgeVariant } from './status-badge.model';

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  label = input.required<string>();
  variant = input<StatusBadgeVariant>('neutral');
}
