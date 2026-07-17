import { Injectable, signal, computed, inject } from '@angular/core';
import { ReferenceService, Stadium, Match, CrisisScenario } from '../core/services/reference.service';

@Injectable({
  providedIn: 'root'
})
export class StadiumStore {
  private refService = inject(ReferenceService);

  readonly stadiums = signal<Stadium[]>([]);
  readonly matches = signal<Match[]>([]);
  readonly selectedStadiumId = signal<string | null>(null);
  readonly availableScenarios = signal<CrisisScenario[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly selectedStadium = computed(() =>
    this.stadiums().find(s => s.id === this.selectedStadiumId()) || null
  );

  readonly liveMatch = computed(() =>
    this.matches().find(m => m.status === 'live') || null
  );

  readonly selectedStadiumMatch = computed(() => {
    const stadiumId = this.selectedStadiumId();
    if (!stadiumId) return null;
    const stadiumMatches = this.matches().filter(m => m.stadiumId === stadiumId);
    const live = stadiumMatches.find(m => m.status === 'live');
    if (live) return live;
    const upcoming = stadiumMatches
      .filter(m => m.status === 'upcoming' || m.status === 'upcoming-final')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  });

  loadReferenceData(): void {
    if (this.stadiums().length > 0) return; // already loaded
    this.isLoading.set(true);
    this.error.set(null);

    this.refService.getStadiums().subscribe({
      next: (data) => this.stadiums.set(data),
      error: () => {
        this.error.set('Failed to load stadium data.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });

    this.refService.getMatches().subscribe({
      next: (data) => this.matches.set(data),
      error: () => this.error.set('Failed to load match data.')
    });
  }

  selectStadium(stadiumId: string): void {
    this.selectedStadiumId.set(stadiumId);
    this.refService.getScenariosByStadium(stadiumId).subscribe({
      next: (data) => this.availableScenarios.set(data),
      error: () => this.error.set('Failed to load crisis scenarios for stadium.')
    });
  }
}
