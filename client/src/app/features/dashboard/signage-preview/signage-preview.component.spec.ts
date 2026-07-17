import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SignagePreviewComponent } from './signage-preview.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('SignagePreviewComponent', () => {
  let storeStub: {
    latestResult: ReturnType<typeof signal<any>>;
    severity: ReturnType<typeof signal<string | null>>;
    addManualNote: jasmine.Spy;
  };

  beforeEach(async () => {
    storeStub = {
      latestResult: signal<any>(null),
      severity: signal<string | null>(null),
      addManualNote: jasmine.createSpy('addManualNote')
    };

    await TestBed.configureTestingModule({
      imports: [SignagePreviewComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
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
});
