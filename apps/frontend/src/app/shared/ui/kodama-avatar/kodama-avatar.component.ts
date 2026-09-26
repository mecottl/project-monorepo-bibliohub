import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { createKodama } from 'kodama-id';

// Avatar determinista (kodama-id, AGPL-3.0) a partir de un texto estable, p. ej. el id del usuario.
// Se sirve como <img> con data URI: dentro de un <img> el SVG no puede ejecutar scripts.
@Component({
  selector: 'app-kodama-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="src()" [width]="size()" [height]="size()" alt="" />`,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    img {
      display: block;
      border-radius: 50%;
    }
  `,
})
export class KodamaAvatarComponent {
  private readonly sanitizer = inject(DomSanitizer);

  semilla = input.required<string>();
  size = input(32);

  src = computed(() => {
    const { svg } = createKodama({
      name: this.semilla(),
      size: this.size(),
      animations: ['blink'],
    });
    return this.sanitizer.bypassSecurityTrustUrl(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
  });
}
