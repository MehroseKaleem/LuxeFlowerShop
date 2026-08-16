import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

interface AuthResponseData {
  user: User;
  accessToken: string;
}

const ACCESS_TOKEN_KEY = 'karaz_access_token';
const USER_CACHE_KEY = 'karaz_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(this.readCachedUser());
  private readonly _accessToken = signal<string | null>(this.readStoredToken());
  private readonly _initializing = signal<boolean>(isPlatformBrowser(this.platformId) && !!this.readStoredToken());

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly initializing = this._initializing.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => {
    const role = this._user()?.role;
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  private refreshInFlight$: Observable<AuthResponseData> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId) && this._accessToken()) {
      // Validate/refresh the cached session in the background so a stale or
      // revoked token doesn't silently keep the user "logged in" client-side.
      this.me().subscribe({
        next: () => this._initializing.set(false),
        error: () => {
          this.clearSession();
          this._initializing.set(false);
        }
      });
    }
  }

  register(payload: { name: string; email: string; phone: string; password: string }): Observable<AuthResponseData> {
    return this.http
      .post<{ data: AuthResponseData }>(`${this.baseUrl}/register`, payload, { withCredentials: true })
      .pipe(
        map(res => res.data),
        tap(data => this.setSession(data.user, data.accessToken))
      );
  }

  login(identifier: string, password: string): Observable<AuthResponseData> {
    return this.http
      .post<{ data: AuthResponseData }>(`${this.baseUrl}/login`, { identifier, password }, { withCredentials: true })
      .pipe(
        map(res => res.data),
        tap(data => this.setSession(data.user, data.accessToken))
      );
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => this.clearSession()));
  }

  me(): Observable<User> {
    return this.http.get<{ data: { user: User } }>(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
      map(res => res.data.user),
      tap(user => this.setUser(user))
    );
  }

  refresh(): Observable<AuthResponseData> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.refreshInFlight$ = this.http
      .post<{ data: AuthResponseData }>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        map(res => res.data),
        tap(data => this.setSession(data.user, data.accessToken)),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay(1)
      );

    return this.refreshInFlight$;
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/reset-password/${token}`, { password });
  }

  verifyEmail(token: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/verify-email/${token}`);
  }

  resendVerification(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/resend-verification`, {}, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/change-password`, { currentPassword, newPassword }, { withCredentials: true });
  }

  setUser(user: User): void {
    this._user.set(user);
    this.writeCachedUser(user);
  }

  setSession(user: User, accessToken: string): void {
    this._user.set(user);
    this._accessToken.set(accessToken);
    this.writeCachedUser(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
  }

  clearSession(): void {
    this._user.set(null);
    this._accessToken.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    }
  }

  private readStoredToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private readCachedUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private writeCachedUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
  }
}
