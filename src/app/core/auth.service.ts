import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'PRODUCER' | 'PLATFORM_ADMIN' | 'BUYER';
  accountId: string | null;
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = 'checkout_access_token';
const REFRESH_KEY = 'checkout_refresh_token';
const USER_KEY = 'checkout_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  private readonly platformId = inject(PLATFORM_ID);
  private refreshRequest$: Observable<string | null> | null = null;
  readonly user = signal<AuthUser | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    if (this.isBrowser) {
      this.user.set(this.readUser());
    }
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get accessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(REFRESH_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken && !!this.refreshToken;
  }

  register(payload: { name: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.api}/auth/register`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  registerBuyer(payload: { name: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.api}/auth/register-buyer`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(payload: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.api}/auth/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.api}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.api}/auth/reset-password`, {
      token,
      password,
    });
  }

  refreshSession(): Observable<string | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http
        .post<AuthResponse>(`${this.api}/auth/refresh`, { refreshToken })
        .pipe(
          tap((res) => this.persistSession(res)),
          map((res) => res.accessToken),
          catchError((err) => {
            this.clearSession();
            return throwError(() => err);
          }),
          finalize(() => {
            this.refreshRequest$ = null;
          }),
          shareReplay(1),
        );
    }

    return this.refreshRequest$;
  }

  logout(options?: { skipApi?: boolean; navigate?: boolean }) {
    const refreshToken = this.refreshToken;
    if (!options?.skipApi && refreshToken) {
      this.http.post(`${this.api}/auth/logout`, { refreshToken }).subscribe({
        error: () => undefined,
      });
    }
    this.clearSession();
    if (options?.navigate !== false) {
      void this.router.navigateByUrl('/login');
    }
  }

  private persistSession(res: AuthResponse) {
    if (!this.isBrowser) return;
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  clearSession() {
    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.user.set(null);
  }

  private readUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
