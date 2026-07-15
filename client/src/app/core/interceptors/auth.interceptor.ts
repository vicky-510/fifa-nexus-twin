import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // A stored token can go stale between page loads (2h expiry, or another
      // session rotating the shared access code) — a 401 here means the server
      // has already rejected it, so clear it and send the user back to log in
      // instead of leaving them stuck on a page that silently fails every call.
      if (err.status === 401 && !req.url.includes('/auth/verify')) {
        authService.logout();
        router.navigate(['/access-code']);
      }
      return throwError(() => err);
    })
  );
};
