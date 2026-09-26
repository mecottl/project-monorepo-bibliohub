import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  viewChild
} from '@angular/core';
import { gsap } from 'gsap';

/**
 * Port a Angular del componente "Skiper 39 Canvas_Landing_004" (Skiper UI, 21st.dev).
 * Inspirado en https://codepen.io/zadvorsky/pen/xxwbBQV — ilustración de https://www.openpeeps.com/
 * Licencia gratuita de Skiper UI: se requiere atribución (ver footer de la landing).
 *
 * `src` es una hoja de sprites: `columnas` personajes por fila x `filas` filas, todos del mismo tamaño.
 */
interface Peep {
  image: HTMLImageElement;
  rect: number[];
  width: number;
  height: number;
  x: number;
  y: number;
  anchorY: number;
  scaleX: number;
  walk: gsap.core.Timeline | null;
}

interface Stage {
  width: number;
  height: number;
}

@Component({
  selector: 'app-crowd-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--alto-crowd]': "altoPct() + '%'" },
  template: `<canvas #lienzo aria-hidden="true"></canvas>`,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    canvas {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: var(--alto-crowd, 90%);
    }
  `
})
export class CrowdCanvasComponent {
  src = input.required<string>();
  // Personajes por fila y filas de la hoja de sprites (nombres de la versión original: rows = columnas).
  columnas = input(15);
  filas = input(7);
  // Cuántos personajes caminan a la vez (de la hoja se eligen al azar), qué tan lento y qué tanto alto ocupan.
  personas = input(105);
  lentitud = input(1);
  altoPct = input(90);
  escala = input(1);
  // Rango vertical (px) en el que se reparten los pies: 250 = varias filas (original), ~70 = una o dos filas.
  profundidad = input(250);
  // Desplaza a toda la multitud hacia abajo (px).
  bajada = input(0);

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  constructor() {
    const injector = inject(Injector);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const detener = this.iniciar();
      destroyRef.onDestroy(detener);
    }, { injector });
  }

  private iniciar(): () => void {
    const canvas = this.lienzo().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    const columnas = this.columnas();
    const filas = this.filas();
    const lentitud = this.lentitud();
    const personas = this.personas();
    const escala = this.escala();
    const profundidad = this.profundidad();
    const bajada = this.bajada();

    const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
    const randomIndex = (array: unknown[]) => randomRange(0, array.length) | 0;

    const img = document.createElement('img');
    const stage: Stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];
    let destruido = false;

    const resetPeep = (peep: Peep) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = profundidad * (0.4 - gsap.parseEase('power2.in')(Math.random())) + bajada;
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      return { startY, endX };
    };

    const normalWalk = (peep: Peep, { startY, endX }: { startY: number; endX: number }) => {
      const xDuration = 10 * lentitud;
      const yDuration = 0.25;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: 'none' }, 0);
      tl.to(
        peep,
        { duration: yDuration, repeat: Math.round(xDuration / yDuration), yoyo: true, y: startY - 10 },
        0
      );
      return tl;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      crowd.splice(crowd.indexOf(peep), 1);
      availablePeeps.push(peep);
    };

    const addPeepToCrowd = (): Peep => {
      const peep = availablePeeps.splice(randomIndex(availablePeeps), 1)[0];
      const walk = normalWalk(peep, resetPeep(peep)).eventCallback('onComplete', () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const initCrowd = () => {
      while (availablePeeps.length) {
        addPeepToCrowd().walk?.progress(Math.random());
      }
    };

    const createPeeps = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = columnas * filas;
      const rectWidth = width / columnas;
      const rectHeight = height / filas;

      for (let i = 0; i < total; i++) {
        allPeeps.push({
          image: img,
          rect: [(i % columnas) * rectWidth, ((i / columnas) | 0) * rectHeight, rectWidth, rectHeight],
          width: rectWidth * escala,
          height: rectHeight * escala,
          x: 0,
          y: 0,
          anchorY: 0,
          scaleX: 1,
          walk: null
        });
      }

      // Deja exactamente `personas`: al azar y, si piden más que la hoja, repitiendo personajes.
      const base = allPeeps.splice(0).sort(() => Math.random() - 0.5);
      for (let i = 0; i < personas; i++) {
        allPeeps.push({ ...base[i % base.length] });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);

      for (const peep of crowd) {
        ctx.save();
        ctx.translate(peep.x, peep.y);
        ctx.scale(peep.scaleX, 1);
        ctx.drawImage(peep.image, peep.rect[0], peep.rect[1], peep.rect[2], peep.rect[3], 0, 0, peep.width, peep.height);
        ctx.restore();
      }

      ctx.restore();
    };

    const resize = () => {
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;

      crowd.forEach((peep) => peep.walk?.kill());
      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);

      initCrowd();
    };

    img.onload = () => {
      if (destruido) return;
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };
    img.src = this.src();

    window.addEventListener('resize', resize);

    return () => {
      destruido = true;
      window.removeEventListener('resize', resize);
      gsap.ticker.remove(render);
      crowd.forEach((peep) => peep.walk?.kill());
    };
  }
}
