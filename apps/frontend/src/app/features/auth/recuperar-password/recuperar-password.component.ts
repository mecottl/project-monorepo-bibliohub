import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/logo/logo.component';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './recuperar-password.component.html',
  styleUrl: '../auth-shared.css'
})
export class RecuperarPasswordComponent {}
