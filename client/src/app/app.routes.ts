import { Routes } from '@angular/router';
import { AccessCodeEntryComponent } from './features/auth/access-code-entry/access-code-entry.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StadiumSelectorComponent } from './features/stadium-selector/stadium-selector.component';
import { GlobalOverviewComponent } from './features/global-overview/global-overview.component';
import { StaffMobileCardComponent } from './features/staff-mobile/staff-mobile-card.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'access-code', component: AccessCodeEntryComponent },
  { path: '', component: StadiumSelectorComponent, canActivate: [authGuard] },
  { path: 'overview', component: GlobalOverviewComponent, canActivate: [authGuard] },
  { path: 'dashboard/:stadiumId', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'staff/:crisisId/:role', component: StaffMobileCardComponent },
  { path: '**', redirectTo: '/access-code' }
];
