import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

const CARPETA = '/login';
const EXTENSIONES = ['png'];
const MAX_SLIDES = 12;
const DURACION_MS = 4000;
const RATIO_POR_DEFECTO = 4 / 3;

@Component({
  selector: 'app-auth-slideshow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-slideshow.component.html',
  styleUrl: './auth-slideshow.component.css'
})
export class AuthSlideshowComponent implements OnInit, OnDestroy {
  slides = signal<string[]>([]);
  activeIndex = signal(0);
  protected readonly duracionMs = DURACION_MS;

  private ratios = signal<number[]>([]);
  activeRatio = computed(() => this.ratios()[this.activeIndex()] ?? RATIO_POR_DEFECTO);

  private timerId?: ReturnType<typeof setInterval>;

  async ngOnInit(): Promise<void> {
    this.slides.set(await this.detectarSlides());
    this.iniciarAutoplay();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerId);
  }

  irA(index: number): void {
    this.activeIndex.set(index);
    this.reiniciarAutoplay();
  }

  onImgLoad(index: number, event: Event): void {
    const img = event.target as HTMLImageElement;
    const ratio = img.naturalWidth / img.naturalHeight;
    this.ratios.update((actuales) => {
      const copia = [...actuales];
      copia[index] = ratio;
      return copia;
    });
  }

  private async detectarSlides(): Promise<string[]> {
    const encontradas: string[] = [];
    for (let n = 1; n <= MAX_SLIDES; n++) {
      const url = await this.probarImagen(n);
      if (!url) break;
      encontradas.push(url);
    }
    return encontradas;
  }

  private async probarImagen(n: number): Promise<string | null> {
    for (const extension of EXTENSIONES) {
      const url = `${CARPETA}/${n}.${extension}`;
      try {
        const respuesta = await fetch(url, { method: 'HEAD' });
        if (respuesta.ok) return url;
      } catch {
        /* la carpeta puede no existir aún; se prueba la siguiente extensión/índice */
      }
    }
    return null;
  }

  private iniciarAutoplay(): void {
    if (this.slides().length <= 1) return;
    this.timerId = setInterval(() => this.avanzar(), DURACION_MS);
  }

  private reiniciarAutoplay(): void {
    clearInterval(this.timerId);
    this.iniciarAutoplay();
  }

  private avanzar(): void {
    this.activeIndex.update((i) => (i + 1) % this.slides().length);
  }
}
