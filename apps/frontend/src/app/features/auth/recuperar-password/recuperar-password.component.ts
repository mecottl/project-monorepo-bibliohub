import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSlideshowComponent } from '../auth-slideshow/auth-slideshow.component';

@Component({
  selector: 'app-recuperar-password',
  imports: [RouterLink, AuthSlideshowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recuperar-password.component.html',
  styleUrl: '../auth-shared.css'
})
export class RecuperarPasswordComponent {}
