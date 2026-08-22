import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.css'
})
export class PlaceholderPageComponent {
  private route = inject(ActivatedRoute);

  titulo = (this.route.snapshot.data['titulo'] as string | undefined) ?? '';
}
