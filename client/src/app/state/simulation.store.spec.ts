import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { SimulationStore } from './simulation.store';
import {
  SimulationService,
  SimulationRecord,
  PredictiveForecast
} from '../core/services/simulation.service';

describe('SimulationStore', () => {
  let store: SimulationStore;
  let simServiceSpy: jasmine.SpyObj<SimulationService>;

  function makeRecord(overrides: Partial<SimulationRecord> = {}): SimulationRecord {
    return {
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
      match_id: null,
      severity: 'HIGH',
      escalated_from: null,
      timeline: [{ timestamp: '2026-01-01T00:00:00Z', type: 'note', message: 'started' }],
      created_at: '2026-01-01T00:00:00Z',
      ...overrides
    };
  }

  beforeEach(() => {
    simServiceSpy = jasmine.createSpyObj('SimulationService', [
      'getHistory',
      'trigger',
      'triggerStream',
      'escalate',
      'predict',
      'addTimelineEntry'
    ]);

    // default benign returns to avoid unhandled subscriptions in unrelated tests
    simServiceSpy.getHistory.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [SimulationStore, { provide: SimulationService, useValue: simServiceSpy }]
    });

    store = TestBed.inject(SimulationStore);
  });

  it('should initialize with empty/default state', () => {
    expect(store.history()).toEqual([]);
    expect(store.activeScenario()).toBeNull();
    expect(store.activeSimulationId()).toBeNull();
    expect(store.latestResult()).toBeNull();
    expect(store.crisisTimeline()).toEqual([]);
    expect(store.isStreaming()).toBe(false);
    expect(store.streamText()).toBe('');
    expect(store.predictiveForecast()).toBeNull();
    expect(store.isPredicting()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.severity()).toBeNull();
  });

  describe('loadHistory', () => {
    it('should populate history and select the first record when none is selected', () => {
      const record = makeRecord();
      simServiceSpy.getHistory.and.returnValue(of([record]));

      store.loadHistory('stad-1');

      expect(simServiceSpy.getHistory).toHaveBeenCalledWith(undefined, 'stad-1');
      expect(store.history()).toEqual([record]);
      expect(store.latestResult()).toEqual(record.result);
      expect(store.activeSimulationId()).toBe(record.id);
      expect(store.isLoading()).toBe(false);
    });

    it('should not overwrite an already-selected latestResult', () => {
      const first = makeRecord({ id: 1 });
      const second = makeRecord({ id: 2 });
      simServiceSpy.getHistory.and.returnValue(of([first]));
      store.loadHistory();
      expect(store.activeSimulationId()).toBe(1);

      simServiceSpy.getHistory.and.returnValue(of([second]));
      store.loadHistory();

      // latestResult was already set, so selectRecord should not run again
      expect(store.activeSimulationId()).toBe(1);
      expect(store.history()).toEqual([second]);
    });

    it('should set error and clear isLoading on failure', () => {
      simServiceSpy.getHistory.and.returnValue(throwError(() => new Error('boom')));

      store.loadHistory('stad-1');

      expect(store.error()).toBe('Failed to load simulation history.');
      expect(store.isLoading()).toBe(false);
    });

    it('should set isLoading true synchronously before resolution', () => {
      const subject = new Subject<SimulationRecord[]>();
      simServiceSpy.getHistory.and.returnValue(subject.asObservable());

      store.loadHistory();
      expect(store.isLoading()).toBe(true);

      subject.next([]);
      subject.complete();
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('triggerSync', () => {
    it('should reset relevant state, apply the record, and refresh history', () => {
      store.streamText.set('leftover');
      store.crisisTimeline.set([{ timestamp: 't', type: 'note', message: 'old' }]);

      const record = makeRecord({ id: 5, stadium_id: 'stad-2' });
      simServiceSpy.trigger.and.returnValue(of(record));
      simServiceSpy.getHistory.and.returnValue(of([record]));

      store.triggerSync('stad-2', 'medical-emergency');

      expect(simServiceSpy.trigger).toHaveBeenCalledWith('stad-2', 'medical-emergency');
      expect(store.streamText()).toBe('');
      expect(store.latestResult()).toEqual(record.result);
      expect(store.activeSimulationId()).toBe(5);
      expect(store.crisisTimeline()).toEqual(record.timeline);
      // applyRecord(record, true) should trigger a history refresh scoped to the stadium
      expect(simServiceSpy.getHistory).toHaveBeenCalledWith(undefined, 'stad-2');
      expect(store.isLoading()).toBe(false);
    });

    it('should set error message on failure', () => {
      simServiceSpy.trigger.and.returnValue(throwError(() => new Error('network')));

      store.triggerSync('stad-1', 'medical-emergency');

      expect(store.error()).toBe('Failed to run simulation. Check connection.');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('triggerStream', () => {
    it('should accumulate streamed text and apply the final record on done', async () => {
      simServiceSpy.triggerStream.and.callFake(
        async (
          _stadiumId: string,
          _scenario: string,
          onChunk: (payload: any) => void,
          onComplete: () => void,
          _onError: (err: any) => void
        ) => {
          onChunk({ text: 'Hello ' });
          onChunk({ text: 'world' });
          const record = makeRecord({ id: 9 });
          onChunk({ done: true, record });
          onComplete();
        }
      );
      simServiceSpy.getHistory.and.returnValue(of([]));

      await store.triggerStream('stad-1', 'medical-emergency');

      expect(store.streamText()).toBe('Hello world');
      expect(store.activeSimulationId()).toBe(9);
      expect(store.isStreaming()).toBe(false);
      expect(store.isLoading()).toBe(false);
    });

    it('should set error from chunk payload without stopping the stream', async () => {
      simServiceSpy.triggerStream.and.callFake(
        async (
          _stadiumId: string,
          _scenario: string,
          onChunk: (payload: any) => void,
          onComplete: () => void,
          _onError: (err: any) => void
        ) => {
          onChunk({ error: 'partial failure' });
          onComplete();
        }
      );

      await store.triggerStream('stad-1', 'medical-emergency');

      expect(store.error()).toBe('partial failure');
      expect(store.isStreaming()).toBe(false);
    });

    it('should set connection-lost error and clear flags on stream failure', async () => {
      simServiceSpy.triggerStream.and.callFake(
        async (
          _stadiumId: string,
          _scenario: string,
          _onChunk: (payload: any) => void,
          _onComplete: () => void,
          onError: (err: any) => void
        ) => {
          onError(new Error('lost'));
        }
      );

      await store.triggerStream('stad-1', 'medical-emergency');

      expect(store.error()).toBe('Connection to simulation stream lost.');
      expect(store.isStreaming()).toBe(false);
      expect(store.isLoading()).toBe(false);
    });

    it('should set isStreaming and isLoading true while in flight', () => {
      simServiceSpy.triggerStream.and.returnValue(new Promise(() => {}));

      store.triggerStream('stad-1', 'medical-emergency');

      expect(store.isStreaming()).toBe(true);
      expect(store.isLoading()).toBe(true);
    });
  });

  describe('escalate', () => {
    it('should do nothing when there is no active simulation id', () => {
      store.escalate();
      expect(simServiceSpy.escalate).not.toHaveBeenCalled();
    });

    it('should escalate the active simulation and apply the resulting record', () => {
      // seed an active simulation id via a selected record
      store.selectRecord(makeRecord({ id: 7 }));
      expect(store.activeSimulationId()).toBe(7);

      const escalated = makeRecord({ id: 7, severity: 'CRITICAL' });
      simServiceSpy.escalate.and.returnValue(of(escalated));
      simServiceSpy.getHistory.and.returnValue(of([escalated]));

      store.escalate();

      expect(simServiceSpy.escalate).toHaveBeenCalledWith(7);
      expect(store.latestResult()).toEqual(escalated.result);
      expect(store.isLoading()).toBe(false);
    });

    it('should set error message on escalate failure', () => {
      store.selectRecord(makeRecord({ id: 7 }));
      simServiceSpy.escalate.and.returnValue(throwError(() => new Error('fail')));

      store.escalate();

      expect(store.error()).toBe('Failed to escalate crisis.');
    });
  });

  describe('predictRisk', () => {
    it('should populate predictiveForecast on success', () => {
      const forecast: PredictiveForecast = {
        risks: [{ label: 'Crowd surge', probability: 0.5, level: 'MEDIUM', windowMinutes: 15 }],
        reasoning: 'test reasoning'
      };
      simServiceSpy.predict.and.returnValue(of(forecast));

      store.predictRisk('stad-1');

      expect(simServiceSpy.predict).toHaveBeenCalledWith('stad-1');
      expect(store.predictiveForecast()).toEqual(forecast);
      expect(store.isPredicting()).toBe(false);
    });

    it('should reset predictiveForecast to null before making the request', () => {
      const subject = new Subject<PredictiveForecast>();
      simServiceSpy.predict.and.returnValue(subject.asObservable());
      store.predictiveForecast.set({ risks: [], reasoning: 'stale' });

      store.predictRisk('stad-1');

      expect(store.predictiveForecast()).toBeNull();
      expect(store.isPredicting()).toBe(true);
    });

    it('should set error message on failure', () => {
      simServiceSpy.predict.and.returnValue(throwError(() => new Error('fail')));

      store.predictRisk('stad-1');

      expect(store.error()).toBe('Failed to generate predictive risk forecast.');
      expect(store.isPredicting()).toBe(false);
    });
  });

  describe('addManualNote', () => {
    it('should do nothing when there is no active simulation id', () => {
      store.addManualNote('a note');
      expect(simServiceSpy.addTimelineEntry).not.toHaveBeenCalled();
    });

    it('should do nothing when the message is blank/whitespace', () => {
      store.selectRecord(makeRecord({ id: 3 }));
      store.addManualNote('   ');
      expect(simServiceSpy.addTimelineEntry).not.toHaveBeenCalled();
    });

    it('should trim the message and update the timeline on success', () => {
      store.selectRecord(makeRecord({ id: 3 }));
      const updatedTimeline = [
        { timestamp: 't1', type: 'note', message: 'Everything OK' }
      ];
      simServiceSpy.addTimelineEntry.and.returnValue(
        of(makeRecord({ id: 3, timeline: updatedTimeline }))
      );

      store.addManualNote('  Everything OK  ');

      expect(simServiceSpy.addTimelineEntry).toHaveBeenCalledWith(3, 'note', 'Everything OK');
      expect(store.crisisTimeline()).toEqual(updatedTimeline);
    });

    it('should set error message on failure', () => {
      store.selectRecord(makeRecord({ id: 3 }));
      simServiceSpy.addTimelineEntry.and.returnValue(throwError(() => new Error('fail')));

      store.addManualNote('note text');

      expect(store.error()).toBe('Failed to add timeline note.');
    });
  });

  describe('selectRecord', () => {
    it('should apply the record without triggering a history refresh', () => {
      const record = makeRecord({ id: 11 });

      store.selectRecord(record);

      expect(store.latestResult()).toEqual(record.result);
      expect(store.activeScenario()).toBe(record.scenario);
      expect(store.activeSimulationId()).toBe(11);
      expect(store.crisisTimeline()).toEqual(record.timeline);
      // getHistory was already stubbed to return [] in beforeEach and should not
      // be invoked again as a result of selectRecord (no refreshHistory flag)
      expect(simServiceSpy.getHistory).not.toHaveBeenCalled();
    });
  });

  describe('severity computed', () => {
    it('should reflect the severity of the latest result', () => {
      expect(store.severity()).toBeNull();
      store.selectRecord(makeRecord({ result: { ...makeRecord().result, severity: 'CRITICAL' } }));
      expect(store.severity()).toBe('CRITICAL');
    });
  });
});
