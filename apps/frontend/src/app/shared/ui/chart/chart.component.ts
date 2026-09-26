import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { aplicarTemaTremor } from '@shared/ui/chart/tremor-theme';
import { ThemeService } from '@core/theme/theme.service';

@Component({
  selector: 'app-chart',
  template: '<canvas #canvas></canvas>',
  styles: ':host { display: block; width: 100%; height: 100%; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly tema = inject(ThemeService);

  config = input.required<ChartConfiguration>();

  private chart: Chart | null = null;
  private vistaLista = false;

  constructor() {
    effect(() => {
      const config = this.config();
      this.tema.tema(); // re-dibuja al cambiar de tema
      if (this.vistaLista) {
        this.render(config);
      }
    });

    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.render(this.config());
  }

  private render(config: ChartConfiguration): void {
    aplicarTemaTremor();
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.canvasRef().nativeElement, config);
  }
}
