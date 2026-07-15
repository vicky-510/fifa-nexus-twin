import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, throwError } from 'rxjs';

const TOKEN_STORAGE_KEY = 'stadiumpulse_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // Session-scoped signal, rehydrated from sessionStorage on construction so a
  // page refresh doesn't lose the session (sessionStorage clears when the tab/
  // browser closes, unlike localStorage, which suits a shared ops-desk terminal).
  private tokenSignal = signal<string | null>(this.readStoredToken());

  isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private http: HttpClient) {}

  private readStoredToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null; // sessionStorage unavailable (e.g. private browsing edge cases)
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  verifyCode(code: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/verify`, { code }).pipe(
      tap(response => {
        if (response && response.token) {
          this.tokenSignal.set(response.token);
          try {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, response.token);
          } catch {
            // Ignore storage failures — session still works in-memory for this tab.
          }
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
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
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
