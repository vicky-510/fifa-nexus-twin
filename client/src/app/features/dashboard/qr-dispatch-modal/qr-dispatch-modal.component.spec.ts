import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import * as QRCode from 'qrcode';
import { QrDispatchModalComponent } from './qr-dispatch-modal.component';
import { SimulationStore } from '../../../state/simulation.store';

// The 'qrcode' package's ES module namespace object is compiled to a frozen object with
// non-configurable, getter-only properties, so `spyOn(QRCode, 'toDataURL')` fails with
// "not declared writable", and the original descriptor can't be restored via
// Object.defineProperty either (it's also non-configurable). Instead we redefine the
// property once, permanently, with a configurable/writable spy slot that subsequent
// tests can freely reassign.
function stubToDataURL(): jasmine.Spy {
  const spy = jasmine.createSpy('toDataURL');
  const descriptor = Object.getOwnPropertyDescriptor(QRCode, 'toDataURL');
  if (!descriptor || descriptor.configurable) {
    Object.defineProperty(QRCode, 'toDataURL', { value: spy, configurable: true, writable: true });
  } else {
    // Already made configurable by an earlier test in this run — just reassign.
    (QRCode as any).toDataURL = spy;
  }
  return spy;
}

describe('QrDispatchModalComponent', () => {
  let storeStub: { activeSimulationId: ReturnType<typeof signal<number | null>> };
  let toDataURLSpy: jasmine.Spy | null;

  beforeEach(async () => {
    storeStub = { activeSimulationId: signal<number | null>(null) };
    toDataURLSpy = null;

    await TestBed.configureTestingModule({
      imports: [QrDispatchModalComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QrDispatchModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a prompt to trigger a simulation when there is no active simulation', () => {
    const fixture = TestBed.createComponent(QrDispatchModalComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trigger a crisis simulation');
  });

  it('should list a button for each role once a simulation is active', () => {
    storeStub.activeSimulationId.set(42);
    const fixture = TestBed.createComponent(QrDispatchModalComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(fixture.componentInstance.roles.length);
    expect(fixture.nativeElement.textContent).toContain('Security');
    expect(fixture.nativeElement.textContent).toContain('Medical');
  });

  describe('selectRole', () => {
    it('should update selectedRole', () => {
      const fixture = TestBed.createComponent(QrDispatchModalComponent);
      const comp = fixture.componentInstance;
      comp.selectRole('medical');
      expect(comp.selectedRole()).toBe('medical');
    });

    it('should generate a QR code targeting the staff dispatch URL once a role and active simulation are both set', async () => {
      toDataURLSpy = stubToDataURL().and.resolveTo('data:image/png;base64,FAKE');

      storeStub.activeSimulationId.set(7);
      const fixture = TestBed.createComponent(QrDispatchModalComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      comp.selectRole('security');
      TestBed.flushEffects();

      // allow the async generateQr() promise chain to resolve
      await fixture.whenStable();
      fixture.detectChanges();

      expect(toDataURLSpy).toHaveBeenCalledWith(
        `${window.location.origin}/staff/7/security`,
        { width: 200, margin: 1 }
      );
      expect(comp.staffUrl()).toBe(`${window.location.origin}/staff/7/security`);
      expect(comp.qrDataUrl()).toBe('data:image/png;base64,FAKE');
    });

    it('should clear qrDataUrl when QR generation fails', async () => {
      toDataURLSpy = stubToDataURL().and.rejectWith(new Error('boom'));

      storeStub.activeSimulationId.set(7);
      const fixture = TestBed.createComponent(QrDispatchModalComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      comp.selectRole('medical');
      TestBed.flushEffects();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(comp.qrDataUrl()).toBeNull();
    });

    it('should not generate a QR code while no simulation is active', () => {
      toDataURLSpy = stubToDataURL().and.resolveTo('data:image/png;base64,FAKE');
      const fixture = TestBed.createComponent(QrDispatchModalComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      comp.selectRole('security');
      TestBed.flushEffects();

      expect(toDataURLSpy).not.toHaveBeenCalled();
    });
  });
});
