import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { AccessCodeEntryComponent } from './access-code-entry.component';
import { AuthService } from '../../../core/services/auth.service';

describe('AccessCodeEntryComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['verifyCode', 'guestLogin']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AccessCodeEntryComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AccessCodeEntryComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show an error and not call authService when submitting an empty code', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.accessCode = '   ';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Please input a valid access code.');
    expect(authServiceSpy.verifyCode).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should authenticate and navigate to root on valid code submission', () => {
    authServiceSpy.verifyCode.and.returnValue(of({ token: 'abc123', role: 'ops_staff' }));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.accessCode = 'FIFA2026OPS';
    component.onSubmit();

    expect(authServiceSpy.verifyCode).toHaveBeenCalledWith('FIFA2026OPS');
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should set an error message and stop loading when verification fails', () => {
    authServiceSpy.verifyCode.and.returnValue(throwError(() => new Error('invalid')));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.accessCode = 'WRONGCODE';
    component.onSubmit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Verification failed. Invalid access credentials.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should trim whitespace from the access code before verifying', () => {
    authServiceSpy.verifyCode.and.returnValue(of({ token: 'abc123', role: 'ops_staff' }));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.accessCode = '  FIFA2026OPS  ';
    component.onSubmit();

    expect(authServiceSpy.verifyCode).toHaveBeenCalledWith('FIFA2026OPS');
  });

  it('should render the error banner in the template when errorMessage is set', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.errorMessage.set('Verification failed. Invalid access credentials.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Verification failed. Invalid access credentials.');
  });

  it('should disable the submit button while loading', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.isLoading.set(true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  describe('guest login', () => {
    it('should start a guest session and navigate to root', () => {
      authServiceSpy.guestLogin.and.returnValue(of({ token: 'guest-token', role: 'guest' }));
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.onGuestLogin();

      expect(authServiceSpy.guestLogin).toHaveBeenCalled();
      expect(component.isGuestLoading()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should show an error if guest login fails', () => {
      authServiceSpy.guestLogin.and.returnValue(throwError(() => new Error('boom')));
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.onGuestLogin();

      expect(component.isGuestLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Could not start a guest session. Please try again.');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('cold-start hint', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('should show a "server waking up" hint if login takes more than a few seconds', () => {
      const pending = new Subject<{ token: string; role: 'ops_staff' }>();
      authServiceSpy.verifyCode.and.returnValue(pending.asObservable());
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.accessCode = 'FIFA2026OPS';
      component.onSubmit();
      expect(component.showColdStartHint()).toBe(false);

      jasmine.clock().tick(4001);
      expect(component.showColdStartHint()).toBe(true);

      pending.next({ token: 'abc123', role: 'ops_staff' });
      pending.complete();
      expect(component.showColdStartHint()).toBe(false);
    });

    it('should not show the hint for a fast (warm) request', () => {
      authServiceSpy.guestLogin.and.returnValue(of({ token: 'guest-token', role: 'guest' }));
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.onGuestLogin();
      jasmine.clock().tick(1000);

      expect(component.showColdStartHint()).toBe(false);
    });

    it('should clear a pending hint timer if the request fails before it fires', () => {
      const pending = new Subject<{ token: string; role: 'guest' }>();
      authServiceSpy.guestLogin.and.returnValue(pending.asObservable());
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.onGuestLogin();
      pending.error(new Error('boom'));

      jasmine.clock().tick(5000);
      expect(component.showColdStartHint()).toBe(false);
    });
  });
});
