import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SimulationService, SimulationRecord, PredictiveForecast } from './simulation.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('SimulationService', () => {
  let service: SimulationService;
  let httpMock: HttpTestingController;

  const dummyRecord: SimulationRecord = {
    id: 1,
    scenario: 'medical-emergency',
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
    stadium_id: 'stad-1',
    match_id: 'match-1',
    severity: 'HIGH',
    escalated_from: null,
    timeline: [],
    created_at: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SimulationService, AuthService]
    });
    service = TestBed.inject(SimulationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('trigger', () => {
    it('should POST to simulation-trigger with stadiumId and scenario', () => {
      service.trigger('stad-1', 'medical-emergency').subscribe(res => {
        expect(res).toEqual(dummyRecord);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation-trigger`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ stadiumId: 'stad-1', scenario: 'medical-emergency' });
      req.flush(dummyRecord);
    });

    it('should propagate an error response', () => {
      let errorCaught: any = null;
      service.trigger('stad-1', 'medical-emergency').subscribe({
        next: () => fail('expected error'),
        error: (err) => (errorCaught = err)
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation-trigger`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBeTruthy();
      expect(errorCaught.status).toBe(500);
    });
  });

  describe('escalate', () => {
    it('should POST to simulation-trigger/escalate with simulationId', () => {
      service.escalate(1).subscribe(res => {
        expect(res).toEqual(dummyRecord);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation-trigger/escalate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ simulationId: 1 });
      req.flush(dummyRecord);
    });
  });

  describe('predict', () => {
    it('should POST to simulation-trigger/predict with stadiumId', () => {
      const forecast: PredictiveForecast = {
        risks: [{ label: 'Crowd surge', probability: 0.6, level: 'HIGH', windowMinutes: 30 }],
        reasoning: 'Historical pattern match'
      };

      service.predict('stad-1').subscribe(res => {
        expect(res).toEqual(forecast);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation-trigger/predict`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ stadiumId: 'stad-1' });
      req.flush(forecast);
    });
  });

  describe('addTimelineEntry', () => {
    it('should POST to simulation/:id/timeline with type and message', () => {
      service.addTimelineEntry(1, 'note', 'Situation update').subscribe(res => {
        expect(res).toEqual(dummyRecord);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/simulation/1/timeline`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: 'note', message: 'Situation update' });
      req.flush(dummyRecord);
    });
  });

  describe('getHistory', () => {
    it('should GET simulation-history with no params when none supplied', () => {
      service.getHistory().subscribe(res => {
        expect(res).toEqual([dummyRecord]);
      });

      const req = httpMock.expectOne(
        r => r.url === `${environment.apiUrl}/api/simulation-history`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([dummyRecord]);
    });

    it('should include scenario param when supplied', () => {
      service.getHistory('medical-emergency').subscribe();

      const req = httpMock.expectOne(
        r => r.url === `${environment.apiUrl}/api/simulation-history`
      );
      expect(req.request.params.get('scenario')).toBe('medical-emergency');
      expect(req.request.params.has('stadiumId')).toBe(false);
      req.flush([dummyRecord]);
    });

    it('should include stadiumId param when supplied', () => {
      service.getHistory(undefined, 'stad-1').subscribe();

      const req = httpMock.expectOne(
        r => r.url === `${environment.apiUrl}/api/simulation-history`
      );
      expect(req.request.params.get('stadiumId')).toBe('stad-1');
      expect(req.request.params.has('scenario')).toBe(false);
      req.flush([dummyRecord]);
    });

    it('should include both params when both are supplied', () => {
      service.getHistory('medical-emergency', 'stad-1').subscribe();

      const req = httpMock.expectOne(
        r => r.url === `${environment.apiUrl}/api/simulation-history`
      );
      expect(req.request.params.get('scenario')).toBe('medical-emergency');
      expect(req.request.params.get('stadiumId')).toBe('stad-1');
      req.flush([dummyRecord]);
    });
  });

  describe('triggerStream', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(TestBed.inject(AuthService), 'getToken').and.returnValue('test-token');
    });

    afterEach(() => {
      void fetchSpy;
    });

    function mockFetchResponse(chunks: string[], ok = true, status = 200) {
      let index = 0;
      const reader = {
        read: async () => {
          if (index < chunks.length) {
            const chunk = chunks[index++];
            return { value: new TextEncoder().encode(chunk), done: false };
          }
          return { value: undefined, done: true };
        }
      };
      const response = {
        ok,
        status,
        body: { getReader: () => reader }
      };
      fetchSpy = spyOn(window as any, 'fetch').and.returnValue(Promise.resolve(response));
      return response;
    }

    it('should send POST with Authorization header and parse SSE "data:" chunks', async () => {
      mockFetchResponse([
        `data: ${JSON.stringify({ text: 'Analyzing...' })}\n\n`,
        `data: ${JSON.stringify({ done: true, record: dummyRecord })}\n\n`
      ]);

      const onChunk = jasmine.createSpy('onChunk');
      const onComplete = jasmine.createSpy('onComplete');
      const onError = jasmine.createSpy('onError');

      await service.triggerStream('stad-1', 'medical-emergency', onChunk, onComplete, onError);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${environment.apiUrl}/api/simulation-trigger/stream`,
        jasmine.objectContaining({
          method: 'POST',
          headers: jasmine.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          }),
          body: JSON.stringify({ stadiumId: 'stad-1', scenario: 'medical-emergency' })
        })
      );

      expect(onChunk).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Analyzing...' }));
      expect(onChunk).toHaveBeenCalledWith(jasmine.objectContaining({ done: true, record: dummyRecord }));
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onError when the HTTP response is not ok', async () => {
      mockFetchResponse([], false, 500);

      const onChunk = jasmine.createSpy('onChunk');
      const onComplete = jasmine.createSpy('onComplete');
      const onError = jasmine.createSpy('onError');

      await service.triggerStream('stad-1', 'medical-emergency', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should call onError when fetch rejects', async () => {
      fetchSpy = spyOn(window as any, 'fetch').and.returnValue(Promise.reject(new Error('network down')));

      const onChunk = jasmine.createSpy('onChunk');
      const onComplete = jasmine.createSpy('onComplete');
      const onError = jasmine.createSpy('onError');

      await service.triggerStream('stad-1', 'medical-emergency', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(jasmine.any(Error));
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
