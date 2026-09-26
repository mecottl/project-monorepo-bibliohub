import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();

  canGoPrev = computed(() => this.page() > 1);
  canGoNext = computed(() => this.page() < this.totalPages());

  goPrev(): void {
    if (this.canGoPrev()) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  goNext(): void {
    if (this.canGoNext()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}
