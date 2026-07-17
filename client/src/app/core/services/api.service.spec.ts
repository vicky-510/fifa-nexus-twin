import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should issue a GET request against baseUrl + path and return the response', () => {
      const dummy = { foo: 'bar' };

      service.get<{ foo: string }>('/api/stadiums').subscribe(res => {
        expect(res).toEqual(dummy);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(dummy);
    });

    it('should forward HttpParams onto the request', () => {
      const params = new HttpParams().set('stadiumId', 'wembley');

      service.get('/api/matches', params).subscribe();

      const req = httpMock.expectOne(
        r => r.url === `${environment.apiUrl}/api/matches` && r.params.get('stadiumId') === 'wembley'
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should propagate errors from the server', () => {
      service.get('/api/stadiums').subscribe({
        next: () => fail('expected an error'),
        error: (err) => expect(err.status).toBe(404)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('post', () => {
    it('should issue a POST request with the given body and return the response', () => {
      const body = { code: 'FIFA2026OPS' };
      const dummy = { token: 'abc' };

      service.post<{ token: string }>('/api/auth/verify', body).subscribe(res => {
        expect(res).toEqual(dummy);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(dummy);
    });

    it('should propagate errors from the server', () => {
      service.post('/api/auth/verify', { code: 'WRONG' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => expect(err.status).toBe(401)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verify`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });
});
