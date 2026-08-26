import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoComponent } from '../../../shared/logo/logo.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  auth = inject(AuthService);

  mostrarAdminChrome = input.required<boolean>();
  abierto = input(false);

  brandClick = output<void>();
  logout = output<void>();
}
