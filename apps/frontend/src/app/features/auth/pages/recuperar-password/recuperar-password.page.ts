import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-recuperar-password',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recuperar-password.page.html',
  styleUrl: '../../../../shared/styles/auth-shared.css',
})
export class RecuperarPasswordPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  mensaje = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.recuperarPassword(this.form.getRawValue().identificador).subscribe({
      next: (res) => {
        this.mensaje.set(res.message);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message ?? 'No se pudo enviar la solicitud.');
        this.loading.set(false);
      },
    });
  }
}
