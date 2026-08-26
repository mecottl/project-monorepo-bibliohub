import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSlideshowComponent } from '../auth-slideshow/auth-slideshow.component';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [RouterLink, AuthSlideshowComponent],
  templateUrl: './recuperar-password.component.html',
  styleUrl: '../auth-shared.css'
})
export class RecuperarPasswordComponent {}
