import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Stadium {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  capacity: number;
  role: string;
  mapType: 'oval-open-air' | 'retractable-dome' | 'circular-modern' | 'compact-rectangle';
  mapX: number;
  mapY: number;
  riskProfile: string[];
  transport: string[];
  uniqueRisks: string;
  gates: string[];
  medicalZones: string[];
  availableCrisisIds: string[];
  status: string;
  color: string;
}

export interface Match {
  id: string;
  stage: string;
  group?: string;
  date: string;
  kickoff: string;
  timezone: string;
  homeTeam: string;
  homeFlagEmoji: string;
  awayTeam: string;
  awayFlagEmoji: string;
  homeScore: number | null;
  awayScore: number | null;
  stadiumId: string;
  status: 'completed' | 'live' | 'upcoming' | 'upcoming-final';
  attendance: number | null;
  note: string;
}

export interface CrisisScenario {
  id: string;
  label: string;
  category: string;
  icon: string;
  severityLevel: number;
  escalatesTo: string | null;
  promptFragment: string;
  agencyFocus: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ReferenceService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api`;

  getStadiums(): Observable<Stadium[]> {
    return this.http.get<Stadium[]>(`${this.apiUrl}/stadiums`);
  }

  getStadiumById(id: string): Observable<Stadium> {
    return this.http.get<Stadium>(`${this.apiUrl}/stadiums/${id}`);
  }

  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/matches`);
  }

  getMatchesByStadium(stadiumId: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/matches/${stadiumId}`);
  }

  getScenarios(): Observable<CrisisScenario[]> {
    return this.http.get<CrisisScenario[]>(`${this.apiUrl}/scenarios`);
  }

  getScenariosByStadium(stadiumId: string): Observable<CrisisScenario[]> {
    return this.http.get<CrisisScenario[]>(`${this.apiUrl}/scenarios/${stadiumId}`);
  }
}
