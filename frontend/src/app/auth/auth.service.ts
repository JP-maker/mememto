import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface Account {
  email: string;
}

/**
 * Compte connecté. La session vit dans un cookie HttpOnly posé par l'API : le navigateur ne voit
 * jamais de mot de passe ni de jeton de session, seulement le résultat de /api/auth/me.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly current = signal<Account | null>(null);
  readonly account = this.current.asReadonly();

  /** Demande à l'API si une session est ouverte (401 = invité). */
  refresh(): void {
    this.http.get<Account>('/api/auth/me').subscribe({
      next: (account) => this.current.set(account),
      error: () => this.current.set(null),
    });
  }

  login(email: string, password: string): Observable<Account> {
    return this.http.post<Account>('/api/auth/login', { email, password }).pipe(tap((a) => this.current.set(a)));
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(tap(() => this.current.set(null)));
  }

  register(email: string, password: string): Observable<void> {
    return this.http.post<void>('/api/auth/register', { email, password });
  }

  confirm(token: string): Observable<void> {
    return this.http.post<void>('/api/auth/confirm', { token });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/forgot', { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset', { token, password });
  }
}
