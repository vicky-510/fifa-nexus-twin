import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SignagePreviewComponent } from './signage-preview.component';
import { SimulationStore } from '../../../state/simulation.store';
import { AuthService } from '../../../core/services/auth.service';

describe('SignagePreviewComponent', () => {
  let storeStub: {
    latestResult: ReturnType<typeof signal<any>>;
    severity: ReturnType<typeof signal<string | null>>;
    addManualNote: jasmine.Spy;
  };
  let authServiceStub: { isGuest: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    storeStub = {
      latestResult: signal<any>(null),
      severity: signal<string | null>(null),
      addManualNote: jasmine.createSpy('addManualNote')
    };
    authServiceStub = { isGuest: signal(false) };

    await TestBed.configureTestingModule({
      imports: [SignagePreviewComponent],
      providers: [
        { provide: SimulationStore, useValue: storeStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignagePreviewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show "No active notice" when there is no latestResult', () => {
    const fixture = TestBed.createComponent(SignagePreviewComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No active notice');
  });

  it('should render the alert severity and navigation directive when a result exists', () => {
    storeStub.latestResult.set({ navigation: 'Evacuate via Gate C immediately' });
    storeStub.severity.set('CRITICAL');
    const fixture = TestBed.createComponent(SignagePreviewComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('CRITICAL');
    expect(text).toContain('Evacuate via Gate C immediately');
  });

  it('should default the severity label to ALERT when store.severity() is falsy', () => {
    storeStub.latestResult.set({ navigation: 'Stand by for instructions' });
    const fixture = TestBed.createComponent(SignagePreviewComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ALERT');
  });

  describe('pushToSignage', () => {
    it('should add a manual note and flip the pushed label, then revert after 2.5s', () => {
      jasmine.clock().install();
      try {
        storeStub.latestResult.set({ navigation: 'Evacuate via Gate C immediately' });
        const fixture = TestBed.createComponent(SignagePreviewComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        expect(comp.pushed()).toBe(false);
        comp.pushToSignage();

        expect(storeStub.addManualNote).toHaveBeenCalledWith('Signage pushed to stadium LED network');
        expect(comp.pushed()).toBe(true);

        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Pushed to Signage Network');

        jasmine.clock().tick(2500);
        expect(comp.pushed()).toBe(false);
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('should be triggered by clicking the push button', () => {
      storeStub.latestResult.set({ navigation: 'Evacuate via Gate C immediately' });
      const fixture = TestBed.createComponent(SignagePreviewComponent);
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      button.click();

      expect(storeStub.addManualNote).toHaveBeenCalled();
      expect(fixture.componentInstance.pushed()).toBe(true);
    });
  });

  describe('guest (read-only) restrictions', () => {
    it('should disable the push-to-signage button for a guest session and show an explanatory note', () => {
      authServiceStub.isGuest.set(true);
      storeStub.latestResult.set({ navigation: 'Evacuate via Gate C immediately' });
      const fixture = TestBed.createComponent(SignagePreviewComponent);
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Read-only guest session');
    });

    it('should leave the push-to-signage button enabled for a full-access session', () => {
      authServiceStub.isGuest.set(false);
      storeStub.latestResult.set({ navigation: 'Evacuate via Gate C immediately' });
      const fixture = TestBed.createComponent(SignagePreviewComponent);
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
      expect(fixture.nativeElement.textContent).not.toContain('Read-only guest session');
    });
  });
});
