import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SimulationResult {
  navigation: string;
  crowdControl: string;
  accessibilityGuidance: string;
  transportUpdates: string;
  sustainability: string;
  operationalRecommendation: string;
  multilingualScripts: {
    en: string;
    es: string;
    fr: string;
  };
}

export interface SimulationRecord {
  id: number;
  scenario: string;
  result: SimulationResult;
  created_at: string;
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
  trigger(scenario: string): Observable<SimulationRecord> {
    return this.http.post<SimulationRecord>(`${this.apiUrl}/simulation-trigger`, { scenario });
  }

  /**
   * History list query
   */
  getHistory(scenario?: string): Observable<SimulationRecord[]> {
    let params = new HttpParams();
    if (scenario) {
      params = params.set('scenario', scenario);
    }
    return this.http.get<SimulationRecord[]>(`${this.apiUrl}/simulation-history`, { params });
  }

  /**
   * SSE Stream trigger request using native fetch reader (since EventSource only supports GET)
   */
  async triggerStream(
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
        body: JSON.stringify({ scenario })
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
