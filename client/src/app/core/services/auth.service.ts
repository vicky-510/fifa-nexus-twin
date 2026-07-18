import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, throwError } from 'rxjs';

const TOKEN_STORAGE_KEY = 'stadiumpulse_token';
const ROLE_STORAGE_KEY = 'stadiumpulse_role';

export type SessionRole = 'ops_staff' | 'guest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // Session-scoped signal, rehydrated from sessionStorage on construction so a
  // page refresh doesn't lose the session (sessionStorage clears when the tab/
  // browser closes, unlike localStorage, which suits a shared ops-desk terminal).
  private tokenSignal = signal<string | null>(this.readStored(TOKEN_STORAGE_KEY));
  private roleSignal = signal<SessionRole | null>(this.readStored(ROLE_STORAGE_KEY) as SessionRole | null);

  isAuthenticated = computed(() => !!this.tokenSignal());
  isGuest = computed(() => this.roleSignal() === 'guest');

  constructor(private http: HttpClient) {}

  private readStored(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null; // sessionStorage unavailable (e.g. private browsing edge cases)
    }
  }

  private setSession(token: string, role: SessionRole): void {
    this.tokenSignal.set(token);
    this.roleSignal.set(role);
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // Ignore storage failures — session still works in-memory for this tab.
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRole(): SessionRole | null {
    return this.roleSignal();
  }

  verifyCode(code: string): Observable<{ token: string; role: SessionRole }> {
    return this.http.post<{ token: string; role: SessionRole }>(`${this.apiUrl}/verify`, { code }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setSession(response.token, response.role || 'ops_staff');
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /** Issues a read-only guest session — no access code required. */
  guestLogin(): Observable<{ token: string; role: SessionRole }> {
    return this.http.post<{ token: string; role: SessionRole }>(`${this.apiUrl}/guest`, {}).pipe(
      tap(response => {
        if (response && response.token) {
          this.setSession(response.token, response.role || 'guest');
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.roleSignal.set(null);
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // Ignore storage failures
    }
  }

  /**
   * Changes the shared access code. Requires knowledge of the current code.
   * On success the server invalidates this and every other existing session,
   * so callers should log out and redirect to re-authentication afterward.
   */
  changeCode(currentCode: string, newCode: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-code`, { currentCode, newCode });
  }
}
