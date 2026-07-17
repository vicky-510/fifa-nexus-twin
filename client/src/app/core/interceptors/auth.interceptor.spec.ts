import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach an Authorization header when a token is present', () => {
    authServiceSpy.getToken.and.returnValue('abc123');

    httpClient.get(`${environment.apiUrl}/api/stadiums`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('should not attach an Authorization header when no token is present', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get(`${environment.apiUrl}/api/stadiums`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should log out and redirect to /access-code on a 401 for a non-verify request', () => {
    authServiceSpy.getToken.and.returnValue('stale-token');

    httpClient.get(`${environment.apiUrl}/api/stadiums`).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/access-code']);
  });

  it('should not log out or redirect on a 401 from the /auth/verify endpoint itself', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.post(`${environment.apiUrl}/api/auth/verify`, { code: 'WRONG' }).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verify`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should propagate non-401 errors without logging out', () => {
    authServiceSpy.getToken.and.returnValue('abc123');

    httpClient.get(`${environment.apiUrl}/api/stadiums`).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
