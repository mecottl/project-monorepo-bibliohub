import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.component.html',
  styleUrl: '../auth-shared.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  loading = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: (res) => {
        this.exito.set(res.message);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message ?? 'No se pudo actualizar la contraseña.');
        this.loading.set(false);
      }
    });
  }
}
