import { Routes } from '@angular/router';
import { AccessCodeEntryComponent } from './features/auth/access-code-entry/access-code-entry.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'access-code', component: AccessCodeEntryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/access-code', pathMatch: 'full' },
  { path: '**', redirectTo: '/access-code' }
];
