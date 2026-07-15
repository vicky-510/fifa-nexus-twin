import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SimulationResult {
  navigation: string;
  medical: string;
  security: string;
  evacuation: string;
  transport: string;
  accessibility: string;
  sustainability: string;
  broadcast: string;
  severity: string;
  operationalRecommendation: string;
  multilingualScripts: {
    en: string;
    es: string;
    fr: string;
  };
}

export interface TimelineEntry {
  timestamp: string;
  type: string;
  message: string;
  severity?: string;
}

export interface SimulationRecord {
  id: number;
  scenario: string;
  result: SimulationResult;
  stadium_id: string | null;
  match_id: string | null;
  severity: string | null;
  escalated_from: number | null;
  timeline: TimelineEntry[];
  created_at: string;
}

export interface PredictiveRisk {
  label: string;
  probability: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  windowMinutes: number;
}

export interface PredictiveForecast {
  risks: PredictiveRisk[];
  reasoning: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Synchronous trigger request
   */
  trigger(stadiumId: string, scenario: string): Observable<SimulationRecord> {
    return this.http.post<SimulationRecord>(`${this.apiUrl}/simulation-trigger`, { stadiumId, scenario });
  }

  /**
   * Escalates an active simulation to the next severity level
   */
  escalate(simulationId: number): Observable<SimulationRecord> {
    return this.http.post<SimulationRecord>(`${this.apiUrl}/simulation-trigger/escalate`, { simulationId });
  }

  /**
   * Predictive risk forecast (not persisted)
   */
  predict(stadiumId: string): Observable<PredictiveForecast> {
    return this.http.post<PredictiveForecast>(`${this.apiUrl}/simulation-trigger/predict`, { stadiumId });
  }

  /**
   * Append a manual/system note to a simulation's crisis timeline
   */
  addTimelineEntry(simulationId: number, type: string, message: string): Observable<SimulationRecord> {
    return this.http.post<SimulationRecord>(`${this.apiUrl}/simulation/${simulationId}/timeline`, { type, message });
  }

  /**
   * History list query
   */
  getHistory(scenario?: string, stadiumId?: string): Observable<SimulationRecord[]> {
    let params = new HttpParams();
    if (scenario) {
      params = params.set('scenario', scenario);
    }
    if (stadiumId) {
      params = params.set('stadiumId', stadiumId);
    }
    return this.http.get<SimulationRecord[]>(`${this.apiUrl}/simulation-history`, { params });
  }

  /**
   * SSE Stream trigger request using native fetch reader (since EventSource only supports GET)
   */
  async triggerStream(
    stadiumId: string,
    scenario: string,
    onChunk: (payload: { text?: string; done?: boolean; record?: SimulationRecord; error?: string }) => void,
    onComplete: () => void,
    onError: (err: any) => void
  ): Promise<void> {
    const token = this.authService.getToken();

    try {
      const response = await fetch(`${this.apiUrl}/simulation-trigger/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stadiumId, scenario })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.substring(6);
            try {
              const payload = JSON.parse(dataStr);
              onChunk(payload);
            } catch (err) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      // Flush final buffer if any content remains
      if (buffer.trim().startsWith('data: ')) {
        const cleanLine = buffer.trim();
        const dataStr = cleanLine.substring(6);
        try {
          const payload = JSON.parse(dataStr);
          onChunk(payload);
        } catch (err) {}
      }

      onComplete();
    } catch (err) {
      onError(err);
    }
  }
}
