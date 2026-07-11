import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  
  // In-memory token storage using Angular Signals
  private tokenSignal = signal<string | null>(null);
  
  isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return this.tokenSignal();
  }

  verifyCode(code: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/verify`, { code }).pipe(
      tap(response => {
        if (response && response.token) {
          this.tokenSignal.set(response.token);
        }
      }),
      catchError(err => {
        this.tokenSignal.set(null);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
  }
}
