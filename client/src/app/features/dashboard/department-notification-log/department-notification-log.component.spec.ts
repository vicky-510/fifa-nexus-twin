import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DepartmentNotificationLogComponent } from './department-notification-log.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('DepartmentNotificationLogComponent', () => {
  let activeScenario: ReturnType<typeof signal<string | null>>;
  let addManualNoteSpy: jasmine.Spy;

  beforeEach(async () => {
    jasmine.clock().install();
    activeScenario = signal<string | null>(null);
    addManualNoteSpy = jasmine.createSpy('addManualNote');

    const storeStub = { activeScenario, addManualNote: addManualNoteSpy };

    await TestBed.configureTestingModule({
      imports: [DepartmentNotificationLogComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  function create() {
    const fixture = TestBed.createComponent(DepartmentNotificationLogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with 8 notifications, all unnotified', () => {
    const fixture = create();
    const notifications = fixture.componentInstance.notifications();
    expect(notifications.length).toBe(8);
    expect(notifications.every(n => !n.notified)).toBe(true);
    expect(fixture.componentInstance.notifiedCount()).toBe(0);
  });

  it('should render the notified/total counter text', () => {
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('0/8 agencies notified');
  });

  it('should dispatch notifications over time when store.activeScenario() changes (constructor effect)', () => {
    const fixture = create();
    activeScenario.set('stampede');
    fixture.detectChanges();

    // Notifications reset immediately on dispatch.
    expect(fixture.componentInstance.notifications().every(n => !n.notified)).toBe(true);

    // Advance past the longest delay (900ms + 7*100ms staggering = 1600ms) to flag all as notified.
    jasmine.clock().tick(2000);

    const notifications = fixture.componentInstance.notifications();
    expect(notifications.every(n => n.notified)).toBe(true);
    expect(fixture.componentInstance.notifiedCount()).toBe(8);
  });

  it('should call store.addManualNote once all agencies are notified', () => {
    const fixture = create();
    activeScenario.set('fire');
    fixture.detectChanges();

    jasmine.clock().tick(2000);

    expect(addManualNoteSpy).toHaveBeenCalledWith('All 8 agencies notified');
    expect(addManualNoteSpy).toHaveBeenCalledTimes(1);
  });

  it('should not re-dispatch when the scenario signal is set to the same value again', () => {
    const fixture = create();
    activeScenario.set('flood');
    fixture.detectChanges();
    jasmine.clock().tick(2000);
    expect(addManualNoteSpy).toHaveBeenCalledTimes(1);

    activeScenario.set('flood');
    fixture.detectChanges();
    jasmine.clock().tick(2000);

    // Still just the single dispatch from the first (distinct) scenario value.
    expect(addManualNoteSpy).toHaveBeenCalledTimes(1);
  });

  it('should re-dispatch and reset notified counts when the scenario changes to a new value', () => {
    const fixture = create();
    activeScenario.set('flood');
    fixture.detectChanges();
    jasmine.clock().tick(2000);
    expect(fixture.componentInstance.notifiedCount()).toBe(8);

    activeScenario.set('stampede');
    fixture.detectChanges();

    // Immediately after dispatch restart, counters reset before ticking forward again.
    expect(fixture.componentInstance.notifiedCount()).toBe(0);

    jasmine.clock().tick(2000);
    expect(fixture.componentInstance.notifiedCount()).toBe(8);
    expect(addManualNoteSpy).toHaveBeenCalledTimes(2);
  });
});
