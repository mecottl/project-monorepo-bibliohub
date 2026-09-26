import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthSlideshowComponent } from '@layouts/auth-layout/auth-slideshow/auth-slideshow.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, AuthSlideshowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {}
