import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangeAccessCodeComponent } from './change-access-code.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ChangeAccessCodeComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['changeCode', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ChangeAccessCodeComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(ChangeAccessCodeComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    // The component re-parents its modal root to document.body; clean up any
    // leftover nodes between tests since fixture.destroy() isn't called here.
    document.querySelectorAll('body > div').forEach(el => {
      if (el.textContent?.includes('Rotate Shared Access Code')) {
        el.remove();
      }
    });
  });

  it('should create with the modal closed', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should open the modal when the trigger button is clicked', () => {
    const fixture = createComponent();
    const triggerButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    triggerButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('should reset all fields and messages on close', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.isOpen.set(true);
    component.currentCode = 'old';
    component.newCode = 'newcode';
    component.confirmCode = 'newcode';
    component.errorMessage.set('some error');
    component.successMessage.set('some success');

    component.close();

    expect(component.isOpen()).toBe(false);
    expect(component.currentCode).toBe('');
    expect(component.newCode).toBe('');
    expect(component.confirmCode).toBe('');
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
  });

  it('should show an error and not call the service when new code and confirmation do not match', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.currentCode = 'current';
    component.newCode = 'abcdef';
    component.confirmCode = 'different';
    component.onSubmit();

    expect(component.errorMessage()).toBe('New code and confirmation do not match.');
    expect(authServiceSpy.changeCode).not.toHaveBeenCalled();
  });

  it('should show an error and not call the service when the new code is shorter than 6 characters', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.currentCode = 'current';
    component.newCode = 'ab';
    component.confirmCode = 'ab';
    component.onSubmit();

    expect(component.errorMessage()).toBe('New code must be at least 6 characters.');
    expect(authServiceSpy.changeCode).not.toHaveBeenCalled();
  });

  it('should rotate the code, log out, and redirect to access-code on success', () => {
    jasmine.clock().install();
    try {
      authServiceSpy.changeCode.and.returnValue(of({ message: 'ok' }));
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.currentCode = 'oldcode';
      component.newCode = 'newcode1';
      component.confirmCode = 'newcode1';
      component.onSubmit();

      expect(authServiceSpy.changeCode).toHaveBeenCalledWith('oldcode', 'newcode1');
      expect(component.isLoading()).toBe(false);
      expect(component.successMessage()).toBe('Code rotated. Logging out — sign back in with the new code.');
      expect(authServiceSpy.logout).toHaveBeenCalled();

      jasmine.clock().tick(1500);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/access-code']);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should show the server error message when changeCode fails', () => {
    authServiceSpy.changeCode.and.returnValue(throwError(() => ({ error: { error: 'Current code is incorrect.' } })));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.currentCode = 'wrongcode';
    component.newCode = 'newcode1';
    component.confirmCode = 'newcode1';
    component.onSubmit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Current code is incorrect.');
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('should fall back to a generic error message when the server error has no message', () => {
    authServiceSpy.changeCode.and.returnValue(throwError(() => ({})));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.currentCode = 'wrongcode';
    component.newCode = 'newcode1';
    component.confirmCode = 'newcode1';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Failed to change access code.');
  });
});
