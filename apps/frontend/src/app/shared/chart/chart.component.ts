import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { aplicarTemaTremor } from '@shared/chart/tremor-theme';

@Component({
  selector: 'app-chart',
  template: '<canvas #canvas></canvas>',
  styles: ':host { display: block; width: 100%; height: 100%; }',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  config = input.required<ChartConfiguration>();

  private chart: Chart | null = null;
  private vistaLista = false;

  constructor() {
    effect(() => {
      const config = this.config();
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
