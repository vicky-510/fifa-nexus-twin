import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * All feature routes are lazy-loaded so the initial bundle only contains the
 * router shell and core services — a visitor landing on the login screen never
 * downloads the (much heavier) ops dashboard, and a ground-staff member
 * scanning a QR code only downloads the lightweight staff card, not the whole
 * command console.
 */
export const routes: Routes = [
  {
    path: 'access-code',
    loadComponent: () =>
      import('./features/auth/access-code-entry/access-code-entry.component').then(
        (m) => m.AccessCodeEntryComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/stadium-selector/stadium-selector.component').then(
        (m) => m.StadiumSelectorComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./features/global-overview/global-overview.component').then(
        (m) => m.GlobalOverviewComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/:stadiumId',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'staff/:crisisId/:role',
    loadComponent: () =>
      import('./features/staff-mobile/staff-mobile-card.component').then(
        (m) => m.StaffMobileCardComponent,
      ),
  },
  { path: '**', redirectTo: '/access-code' },
];
