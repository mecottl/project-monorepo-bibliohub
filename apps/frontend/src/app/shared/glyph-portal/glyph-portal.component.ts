import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input
} from '@angular/core';

/**
 * Port a Angular de "Glyph Portal" (© 2026 Christian Katzmann, MIT — https://ktzm.dk, vía 21st.dev).
 * Una cámara guiada por el scroll que atraviesa una palabra: se elige una letra y la vista entra por su
 * interior hasta llenar la pantalla, revelando el contenido siguiente. Se conserva este aviso.
 *
 * Proyección de contenido: [gpBackground] (escena recortada por las letras), [gpFront] (composición de la
 * primera vista, sobre la escena) y el contenido por defecto (lo que aparece al entrar).
 */

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const DEFAULT_FONT = '"Arial Black", "Arial", sans-serif';

interface Ink { x: number; y: number; radius: number; index: number }
interface Letter { index: number; x: number; y: number; width: number; height: number }

/** Mayor cuadrado opaco dentro de la letra (tiempo lineal): sirve en O, S, Ø… */
export function interior(context: CanvasRenderingContext2D, char: string, font: string): Omit<Ink, 'index'> | null {
  const canvas = context.canvas;
  context.font = font;
  const m = context.measureText(char);
  const pad = 8;
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const ascent = Math.ceil(m.actualBoundingBoxAscent);
  canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
  canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
  context.font = font;
  context.fontKerning = 'none';
  context.fillText(char, pad + left, pad + ascent);
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const rows = new Uint16Array(width + 1);
  let size = 0, bx = 0, by = 0;
  for (let y = 0; y < height; y++) {
    let diagonal = 0;
    for (let x = 0; x < width; x++) {
      const above = rows[x + 1];
      rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245 ? Math.min(above, rows[x], diagonal) + 1 : 0;
      diagonal = above;
      if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
    }
  }
  if (size < 3) return null;
  // Escaneo a 3× el tamaño SVG; se inscribe un disco en el cuadrado con margen por diferencias de raster.
  return { x: (bx + 1 - size / 2 - pad - left) / 3, y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
}

let contador = 0;

@Component({
  selector: 'app-glyph-portal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[attr.id]': 'uid', '[attr.aria-label]': 'texto()', '[style.--gp-length]': 'largo()', '[style.--gp-characters]': 'caracteres().length' },
  template: `
    <div data-gp-viewport aria-hidden="true"></div>
    <div data-gp-pin>
      <div data-gp-field aria-hidden="true" inert><ng-content select="[gpBackground]" /></div>
      <svg data-gp-art aria-hidden="true" focusable="false">
        <defs>
          <clipPath [attr.id]="clipId" clipPathUnits="userSpaceOnUse">
            <text data-gp-glyph x="0" y="0" [style.fontFamily]="fontFamily()" [style.fontWeight]="peso()" style="font-size:100px;font-kerning:none;font-variant-ligatures:none;letter-spacing:0">{{ texto() }}</text>
          </clipPath>
        </defs>
        <g data-gp-marks style="visibility:hidden"><path /></g>
      </svg>
      <div data-gp-choices role="radiogroup" aria-label="Elige la letra por la que entrar" inert>
        @for (c of caracteres(); track c.index; let i = $index) {
          <button type="button" role="radio" aria-checked="false" tabindex="-1" [attr.data-gp-letter]="c.index" [attr.aria-label]="c.char + ', letra ' + (i + 1) + ' de ' + caracteres().length"></button>
        }
      </div>
      <label data-gp-touch-picker>
        <span class="gp-sr">Letra de entrada</span>
        <select data-gp-select>
          <option value="" disabled selected>Elige una letra</option>
          @for (c of caracteres(); track c.index; let i = $index) {
            <option [value]="c.index">{{ i + 1 }} · {{ c.char }}</option>
          }
        </select>
      </label>
      <div data-gp-front><ng-content select="[gpFront]" /></div>
      <span data-gp-fallback aria-hidden="true" [style.fontFamily]="fontFamily()" [style.fontWeight]="peso()">{{ texto() }}</span>
    </div>
    <div data-gp-content [attr.id]="uid + '-content'" tabindex="-1"><ng-content /></div>
  `,
  styles: `
    :where(app-glyph-portal){display:block;--gp-paper:#fff;--gp-ink:#0c1212;--gp-field:#0b3b2a;--gp-foreground:#fbfbfa;position:relative;isolation:isolate;background:var(--gp-paper);color:var(--gp-ink);font-family:Arial,sans-serif;}
    app-glyph-portal>[data-gp-viewport]{position:absolute;inset:0 auto auto 0;height:100vh;height:100svh;width:0;pointer-events:none;visibility:hidden;}
    app-glyph-portal [data-gp-pin]{position:relative;height:var(--gp-height,100svh);overflow:clip;isolation:isolate;container-type:size;}
    app-glyph-portal [data-gp-field]{position:absolute;inset:0;background:var(--gp-field);opacity:0;pointer-events:none;overflow:hidden;}
    app-glyph-portal[data-gp-ready] [data-gp-field]{opacity:1;}
    app-glyph-portal [data-gp-field]>*{transform:scale(var(--gp-field-scale,1));}
    app-glyph-portal [data-gp-art]{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;}
    app-glyph-portal [data-gp-marks]{fill:none;stroke:var(--gp-ink);opacity:.6;}
    app-glyph-portal [data-gp-choices]{position:absolute;inset:0;visibility:hidden;pointer-events:none;}
    app-glyph-portal[data-gp-choosing=true] [data-gp-choices]{visibility:visible;}
    app-glyph-portal [data-gp-letter]{box-sizing:border-box;position:absolute;border:0;padding:0;margin:0;background:transparent;cursor:pointer;pointer-events:auto;touch-action:pan-y;}
    app-glyph-portal [data-gp-letter]:disabled{pointer-events:none;}
    app-glyph-portal [data-gp-letter]:focus-visible{outline:2px solid var(--gp-field);outline-offset:5px;}
    app-glyph-portal [data-gp-touch-picker]{display:none;position:absolute;top:auto;bottom:18px;left:50%;transform:translateX(-50%);font:12px/1.4 Arial,sans-serif;align-items:center;gap:12px;visibility:hidden;}
    app-glyph-portal[data-gp-choosing=true] [data-gp-touch-picker]{visibility:visible;}
    app-glyph-portal [data-gp-select]{min-height:44px;min-width:90px;border:1px solid transparent;border-radius:8px;background:var(--gp-paper);color:#626964;padding:0 10px;font:inherit;}
    app-glyph-portal [data-gp-select]:focus-visible{outline:2px solid var(--gp-field);outline-offset:4px;}
    app-glyph-portal .gp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);}
    @media(any-pointer:coarse){app-glyph-portal [data-gp-touch-picker]{display:flex;}}
    app-glyph-portal [data-gp-fallback]{position:absolute;inset:0;display:none;place-items:center;font-size:min(calc(100cqw / var(--gp-characters)),38cqh);line-height:1;color:var(--gp-field);}
    app-glyph-portal[data-gp-ready] [data-gp-fallback]{visibility:hidden;}
    app-glyph-portal [data-gp-front]{position:absolute;inset:0;opacity:var(--gp-caption,1);pointer-events:none;}
    app-glyph-portal [data-gp-front] a,app-glyph-portal [data-gp-front] button{pointer-events:var(--gp-caption-hit,auto);}
    app-glyph-portal [data-gp-front]:focus-within{opacity:1;}
    app-glyph-portal [data-gp-content]{box-sizing:border-box;position:relative;min-height:var(--gp-height,100svh);padding:clamp(32px,7%,100px);display:grid;align-content:center;color:var(--gp-foreground);background:var(--gp-field);overflow-wrap:anywhere;}
    app-glyph-portal[data-gp-motion=on] [data-gp-pin]{position:sticky;top:0;}
    app-glyph-portal[data-gp-motion=on] [data-gp-content]{margin-top:calc((var(--gp-length) - 1) * var(--gp-height));background:transparent;opacity:var(--gp-reveal,0);pointer-events:none;}
    app-glyph-portal[data-gp-motion=on][data-gp-entered=true] [data-gp-content]{pointer-events:auto;}
    app-glyph-portal[data-gp-motion=on]:has([data-gp-content]:focus-within) [data-gp-field]{clip-path:none!important;}
    app-glyph-portal[data-gp-motion=on] [data-gp-content]:focus-within{opacity:1;pointer-events:auto;}
    @media(prefers-reduced-motion:reduce){app-glyph-portal [data-gp-pin]{position:relative!important;} app-glyph-portal [data-gp-content]{margin-top:0!important;opacity:1!important;background:var(--gp-field)!important;min-height:0;padding-block:64px;}}
  `
})
export class GlyphPortalComponent {
  word = input('SUBLIME');
  /** Primera letra que coincida. Vacío = el mayor parche de tinta. */
  focusChar = input('');
  /** Hover / toque / flechas para elegir letra antes de hacer scroll. */
  interactive = input(true);
  /** Recorrido de scroll en alturas de vista, limitado a 1–8. */
  scrollLength = input(2.4);
  fontFamily = input(DEFAULT_FONT);
  fontWeight = input(900);
  /** Se emite por frame de scroll, sin pasar por el ciclo de detección de cambios. */
  onProgress = input<((p: number) => void) | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  readonly uid = `gp-${++contador}`;
  readonly clipId = `${this.uid}-clip`;

  texto = computed(() => this.word().trim().normalize('NFC') || 'SUBLIME');
  largo = computed(() => (Number.isFinite(this.scrollLength()) ? clamp(this.scrollLength(), 1, 8) : 2.4));
  peso = computed(() => (Number.isFinite(this.fontWeight()) ? clamp(this.fontWeight(), 1, 1000) : 900));
  caracteres = computed(() => {
    let offset = 0;
    return Array.from(this.texto(), (char) => {
      const index = offset;
      offset += char.length;
      return { char, index };
    });
  });

  constructor() {
    afterNextRender(
      async () => {
        await this.esperarFuente();
        if (this.destruido) return;
        this.destroyRef.onDestroy(this.iniciar());
      },
      { injector: this.injector }
    );
    this.destroyRef.onDestroy(() => (this.destruido = true));
  }

  private destruido = false;

  // La geometría se mide una vez con la fuente ya lista: un cambio posterior movería la tinta bajo la cámara.
  private async esperarFuente(): Promise<void> {
    const familia = this.fontFamily().split(',')[0].trim();
    try {
      await Promise.race([
        document.fonts.load(`${this.peso()} 100px ${familia}`, this.texto()),
        new Promise((resolver) => setTimeout(resolver, 1500))
      ]);
    } catch {
      /* se usa la pila de respaldo */
    }
  }

  private iniciar(): () => void {
    const section = this.host.nativeElement;
    const text = this.texto();
    const fontFamily = this.fontFamily();
    const weight = this.peso();
    const length = this.largo();
    const interactive = this.interactive();
    const focusChar = this.focusChar();
    const clipId = this.clipId;
    const progressRef = this.onProgress;

    const pin = section.querySelector<HTMLElement>('[data-gp-pin]')!;
    const field = section.querySelector<HTMLElement>('[data-gp-field]')!;
    const art = section.querySelector<SVGSVGElement>('[data-gp-art]')!;
    const clip = section.querySelector<SVGClipPathElement>(`#${clipId}`)!;
    const glyph = section.querySelector<SVGTextElement>('[data-gp-glyph]')!;
    const marks = section.querySelector<SVGGElement>('[data-gp-marks]')!;
    const choices = section.querySelector<HTMLElement>('[data-gp-choices]')!;
    const buttons = Array.from(choices.querySelectorAll<HTMLButtonElement>('button'));
    const picker = section.querySelector<HTMLSelectElement>('[data-gp-select]')!;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const hasFront = section.querySelector('[data-gp-front]')!.childElementCount > 0;

    let disposed = false, raf = 0, dirty = true, active = true, ready = false;
    const mountedAt = performance.now();
    let browserFrameSeen = false, stalled = false;
    let W = 1, H = 1, travel = 1, startScale = 1, endScale = 1;
    let center = { x: 0, y: 0 }, target: Ink | null = null;
    let lastProgress = -1;
    let candidates: Ink[] = [], letters: Letter[] = [];
    let choosing = false;
    let bounds = { x: 0, y: 0, width: 1, height: 1 };
    let fontDirty = true;

    // Se congela una cara disponible para este montaje; si alguna no está lista, se usa la de respaldo.
    glyph.style.fontFamily = fontFamily;
    const computedFamily = getComputedStyle(glyph).fontFamily;
    const families = computedFamily.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g) ?? [];
    const available = families.filter((family) => {
      try { return document.fonts.check(`${weight} 100px ${family.trim()}`, text); } catch { return false; }
    });
    glyph.style.fontFamily = [...available, DEFAULT_FONT].join(',');
    stalled = available.length < families.length;

    const readInk = () => {
      if (!context) return false;
      const font = getComputedStyle(glyph);
      const scanFont = `${font.fontWeight} 300px ${font.fontFamily}`;
      context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
      context.fontKerning = 'none';
      const metrics = context.measureText(text);
      const advances = Array.from({ length: text.length }, (_, i) => context.measureText(text.slice(0, i)).width);
      // Se encuadra la tinta visible (getBBox incluye el interlineado en algunos motores).
      bounds = {
        x: -metrics.actualBoundingBoxLeft,
        y: -metrics.actualBoundingBoxAscent,
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      };
      if (!bounds.width || !bounds.height) return false;
      center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const requested = focusChar ? text.indexOf(focusChar.normalize('NFC')) : -1;
      let offset = 0;
      candidates = []; letters = [];
      for (const char of Array.from(text)) {
        context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
        const m = context.measureText(char);
        letters.push({
          index: offset, x: advances[offset] - m.actualBoundingBoxLeft, y: -m.actualBoundingBoxAscent,
          width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
          height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
        });
        const found = interior(context, char, scanFont);
        if (found) candidates.push({ ...found, x: found.x + advances[offset], index: offset });
        offset += char.length;
      }
      target =
        candidates.find((candidate) => candidate.index === requested) ??
        [...candidates].sort((a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x))[0] ??
        null;
      return true;
    };

    const select = (next: Ink | null) => {
      target = next;
      endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
      section.dataset['gpFocus'] = target ? Array.from(text.slice(target.index))[0] : '';
      section.dataset['gpFocusIndex'] = String(target?.index ?? -1);
      for (const button of buttons) {
        const selected = Number(button.dataset['gpLetter']) === target?.index;
        button.disabled = !candidates.some((candidate) => candidate.index === Number(button.dataset['gpLetter']));
        button.setAttribute('aria-checked', String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      if (picker.value !== '') picker.value = String(target?.index ?? -1);
      for (const option of Array.from(picker.options)) {
        option.disabled = option.value === '' || !candidates.some((candidate) => candidate.index === Number(option.value));
      }
    };

    const position = () => clamp(-section.getBoundingClientRect().top / travel);

    const paint = (progress: number) => {
      const isStatic = motion.matches || !browserFrameSeen || stalled || !target;
      const p = isStatic ? 0 : progress;
      const t = clamp(p / 0.78);
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
      const blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
      const cx = center.x + ((target?.x ?? center.x) - center.x) * blend;
      const cy = center.y + ((target?.y ?? center.y) - center.y) * blend;
      const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
      const transform = `translate(${W / 2} ${H * 0.46 + H * 0.04 * eased}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;
      // La escala va en el clip (evita límites de pintado de texto); la traslación queda en el texto local.
      const radians = (roll * Math.PI) / 180;
      const dx = W / 2 / scale, dy = (H * 0.46 + H * 0.04 * eased) / scale;
      clip.setAttribute('transform', `scale(${scale}) rotate(${roll})`);
      glyph.setAttribute(
        'transform',
        `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`
      );
      marks.setAttribute('transform', transform);
      choosing = interactive && !isStatic && p < 0.04;
      choices.inert = !choosing;
      section.dataset['gpChoosing'] = String(choosing);
      // El clip se quita solo cuando la cámara ya llenó la vista con tinta.
      field.style.clipPath = t >= 1 ? 'none' : `url(#${clipId})`;
      section.style.setProperty('--gp-caption', String(1 - smooth(0.01, 0.16, p)));
      section.style.setProperty('--gp-reveal', String(isStatic ? 1 : smooth(0.78, 0.9, p)));
      section.style.setProperty('--gp-field-scale', String(1 + 0.16 * smooth(0, 0.82, p)));
      section.style.setProperty('--gp-caption-hit', p < 0.08 ? 'auto' : 'none');
      section.dataset['gpEntered'] = String(p >= 0.9);
      section.dataset['gpProgress'] = p.toFixed(5);
      if (p !== lastProgress) { lastProgress = p; progressRef()?.(p); }
    };

    const layout = () => {
      if (!section.clientWidth) return;
      W = pin.clientWidth;
      // Una sonda de 100svh evita que la barra del navegador cambie continuamente el recorrido.
      const smallViewport = section.querySelector<HTMLElement>('[data-gp-viewport]')!.offsetHeight;
      const viewportHeight = Math.max(1, smallViewport);
      H = motion.matches ? Math.min(viewportHeight * 0.75, 480) : viewportHeight;
      section.style.setProperty('--gp-height', `${H}px`);
      travel = H * length;
      art.setAttribute('viewBox', `0 0 ${W} ${H}`);
      if (fontDirty) { ready = readInk(); fontDirty = false; }
      if (!ready) return;
      const wordHeight = hasFront && H < 480 ? Math.min(H * 0.38, Math.max(24, H - 264)) : H * 0.38;
      startScale = Math.min((W * 0.84) / bounds.width, wordHeight / bounds.height);
      select(target);
      for (const button of buttons) {
        const letter = letters.find((item) => item.index === Number(button.dataset['gpLetter']))!;
        Object.assign(button.style, {
          left: `${W / 2 + (letter.x - center.x) * startScale}px`,
          top: `${H * 0.46 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`,
          width: `${Math.max(1, letter.width * startScale)}px`,
          height: `${Math.max(44, letter.height * startScale)}px`
        });
      }
      section.style.setProperty('--gp-word-top', `${H * 0.46 - (bounds.height * startScale) / 2}px`);
      section.style.setProperty('--gp-word-bottom', `${H * 0.46 + (bounds.height * startScale) / 2}px`);
      section.dataset['gpReady'] = 'true';
      section.dataset['gpMotion'] = !motion.matches && browserFrameSeen && !stalled && target ? 'on' : 'off';
    };

    const frame = (time?: number) => {
      raf = 0;
      if (disposed) return;
      if (time !== undefined && !browserFrameSeen) {
        browserFrameSeen = true;
        stalled ||= performance.now() - mountedAt > 2500;
        dirty = true;
      }
      if (dirty) { dirty = false; layout(); }
      if (ready) paint(position());
    };
    const schedule = () => { if (!raf && active) raf = requestAnimationFrame(frame); };
    const resize = () => { cancelAnimationFrame(raf); dirty = true; frame(); };
    const scroll = () => schedule();
    const choose = (event: Event) => {
      if (!choosing || position() >= 0.04) return;
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-gp-letter]');
      const next = candidates.find((candidate) => candidate.index === Number(button?.dataset['gpLetter']));
      if (!next || next === target) return;
      select(next);
      paint(position());
    };
    const navigate = (event: KeyboardEvent) => {
      if (!choosing || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = candidates.indexOf(target!);
      const index =
        event.key === 'Home' ? 0
        : event.key === 'End' ? candidates.length - 1
        : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + candidates.length) % candidates.length;
      buttons.find((button) => Number(button.dataset['gpLetter']) === candidates[index].index)?.focus({ preventScroll: true });
    };
    const pick = () => {
      if (!choosing || position() >= 0.04) return;
      const next = candidates.find((candidate) => candidate.index === Number(picker.value));
      if (next) { select(next); paint(position()); }
    };

    choices.addEventListener('pointerover', choose);
    choices.addEventListener('click', choose);
    choices.addEventListener('focusin', choose);
    choices.addEventListener('keydown', navigate);
    picker.addEventListener('change', pick);
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) { dirty = true; schedule(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      },
      { rootMargin: '100% 0px' }
    );
    visibility.observe(section);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    motion.addEventListener('change', resize);
    frame();
    // WebKit puede retener frames tras una fuente colgada: se empieza en flujo normal y el movimiento
    // solo se activa si el navegador empieza a renderizar de inmediato.
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      motion.removeEventListener('change', resize);
      choices.removeEventListener('pointerover', choose);
      choices.removeEventListener('click', choose);
      choices.removeEventListener('focusin', choose);
      choices.removeEventListener('keydown', navigate);
      picker.removeEventListener('change', pick);
    };
  }
}
