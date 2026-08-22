import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthUser, LoginResponse, RegistroClientePayload } from './auth.model';
import { API_BASE_URL } from '../api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API = API_BASE_URL;

  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');
  isCajero = computed(() => this.currentUser()?.rol === 'cajero');
  isCliente = computed(() => this.currentUser()?.rol === 'cliente');

  constructor() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
    }
  }

  login(identificador: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.API}/auth/login`, { identificador, password })
      .pipe(tap((res) => this.guardarSesion(res)));
  }

  registrarCliente(payload: RegistroClientePayload) {
    return this.http
      .post<LoginResponse>(`${this.API}/auth/registro-cliente`, payload)
      .pipe(tap((res) => this.guardarSesion(res)));
  }

  logout(): void {
    this.http.post(`${this.API}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
  }

  private guardarSesion(res: LoginResponse): void {
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.perfil));
    this.currentUser.set(res.perfil);
  }

  private clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}