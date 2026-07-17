import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StaffService, PublicSimulationRecord } from './staff.service';
import { environment } from '../../../environments/environment';

describe('StaffService', () => {
  let service: StaffService;
  let httpMock: HttpTestingController;

  const dummyPublicRecord: PublicSimulationRecord = {
    id: 42,
    scenario: 'medical-emergency',
    scenarioLabel: 'Medical Emergency',
    severity: 'HIGH',
    stadiumName: 'MetLife Stadium',
    gate: 'Gate A',
    result: {
      navigation: 'nav',
      medical: 'med',
      security: 'sec',
      evacuation: 'evac',
      transport: 'trans',
      accessibility: 'acc',
      sustainability: 'sus',
      broadcast: 'bcast',
      severity: 'HIGH',
      operationalRecommendation: 'recommend',
      multilingualScripts: { en: 'en', es: 'es', fr: 'fr' }
    },
    createdAt: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StaffService]
    });
    service = TestBed.inject(StaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPublicRecord', () => {
    it('should GET the public simulation record by id', () => {
      service.getPublicRecord('42').subscribe(res => {
        expect(res).toEqual(dummyPublicRecord);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation/42/public`);
      expect(req.request.method).toBe('GET');
      req.flush(dummyPublicRecord);
    });

    it('should propagate an error response', () => {
      let errorCaught: any = null;
      service.getPublicRecord('missing-id').subscribe({
        next: () => fail('expected error'),
        error: (err) => (errorCaught = err)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation/missing-id/public`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBeTruthy();
      expect(errorCaught.status).toBe(404);
    });
  });
});
