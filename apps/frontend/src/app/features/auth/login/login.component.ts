import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSlideshowComponent } from '../auth-slideshow/auth-slideshow.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthSlideshowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: '../auth-shared.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { identificador, password } = this.form.value;
    this.auth.login(identificador!, password!).subscribe({
      next: () => this.router.navigate([this.auth.isAdmin() ? '/dashboard' : '/inicio']),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message ?? 'Credenciales incorrectas');
        this.loading.set(false);
      }
    });
  }
}