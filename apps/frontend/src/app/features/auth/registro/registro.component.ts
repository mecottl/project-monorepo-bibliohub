import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSlideshowComponent } from '../auth-slideshow/auth-slideshow.component';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, AuthSlideshowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro.component.html',
  styleUrl: '../auth-shared.css'
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { nombre, telefono, password } = this.form.value;
    this.auth.registrarCliente({ nombre: nombre!, telefono: telefono!, password: password! }).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message ?? 'No se pudo crear la cuenta');
        this.loading.set(false);
      }
    });
  }
}
