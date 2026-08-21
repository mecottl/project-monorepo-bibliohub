import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
