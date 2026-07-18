import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created with initial unauthenticated state', () => {
    expect(service).toBeDefined();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should authenticate successfully with valid access code', () => {
    const dummyResponse = { token: 'dummy-signed-token', role: 'ops_staff' as const };
    const testCode = 'FIFA2026OPS';

    service.verifyCode(testCode).subscribe(res => {
      expect(res.token).toBe('dummy-signed-token');
      expect(service.getToken()).toBe('dummy-signed-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verify`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: testCode });
    req.flush(dummyResponse);
  });

  it('should start a read-only guest session without an access code', () => {
    const dummyResponse = { token: 'guest-token', role: 'guest' as const };

    service.guestLogin().subscribe(res => {
      expect(res.token).toBe('guest-token');
      expect(service.getToken()).toBe('guest-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/guest`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(dummyResponse);
  });

  it('should reset state on logout', () => {
    // Manually trigger authenticated state
    const dummyResponse = { token: 'dummy-signed-token' };
    service.verifyCode('FIFA2026OPS').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verify`);
    req.flush(dummyResponse);

    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should reset guest state on logout', () => {
    service.guestLogin().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/guest`).flush({ token: 'guest-token', role: 'guest' });

    expect(service.isGuest()).toBe(true);

    service.logout();
    expect(service.isGuest()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });
});
