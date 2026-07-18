import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SimulationResult } from './simulation.service';

export interface PublicSimulationRecord {
  id: number;
  scenario: string;
  scenarioLabel: string;
  severity: string;
  stadiumName: string | null;
  gate: string | null;
  result: SimulationResult;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api`;

  getPublicRecord(simulationId: string): Observable<PublicSimulationRecord> {
    return this.http.get<PublicSimulationRecord>(
      `${this.apiUrl}/simulation/${simulationId}/public`,
    );
  }
}
