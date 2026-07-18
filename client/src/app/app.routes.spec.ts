import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';

describe('routes', () => {
  it('should be defined and non-empty', () => {
    expect(routes).toBeDefined();
    expect(routes.length).toBe(6);
  });

  it('should define the access-code route without a guard', () => {
    const route = routes.find(r => r.path === 'access-code');
    expect(route).toBeDefined();
    expect(route!.loadComponent).toBeDefined();
    expect(route!.canActivate).toBeUndefined();
  });

  it('should protect the root route with authGuard', () => {
    const route = routes.find(r => r.path === '');
    expect(route).toBeDefined();
    expect(route!.loadComponent).toBeDefined();
    expect(route!.canActivate).toContain(authGuard);
  });

  it('should protect the overview route with authGuard', () => {
    const route = routes.find(r => r.path === 'overview');
    expect(route).toBeDefined();
    expect(route!.canActivate).toContain(authGuard);
  });

  it('should protect the dashboard/:stadiumId route with authGuard', () => {
    const route = routes.find(r => r.path === 'dashboard/:stadiumId');
    expect(route).toBeDefined();
    expect(route!.canActivate).toContain(authGuard);
  });

  it('should leave the staff/:crisisId/:role route unguarded (public mobile card)', () => {
    const route = routes.find(r => r.path === 'staff/:crisisId/:role');
    expect(route).toBeDefined();
    expect(route!.canActivate).toBeUndefined();
  });

  it('should define a wildcard route redirecting to /access-code', () => {
    const route = routes.find(r => r.path === '**');
    expect(route).toBeDefined();
    expect(route!.redirectTo).toBe('/access-code');
  });
});
