import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInputComponent {
  placeholder = input('Buscar…');
  debounceMs = input(300);
  ariaLabel = input('Buscar');

  search = output<string>();

  value = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.search.emit(this.value().trim());
    }, this.debounceMs());
  }

  clear(): void {
    this.value.set('');
    this.search.emit('');
  }
}
