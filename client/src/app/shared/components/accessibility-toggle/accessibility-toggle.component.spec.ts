import { TestBed } from '@angular/core/testing';
import { AccessibilityToggleComponent } from './accessibility-toggle.component';

describe('AccessibilityToggleComponent', () => {
  beforeEach(async () => {
    document.body.classList.remove('high-contrast');
    document.documentElement.classList.remove('large-text');

    await TestBed.configureTestingModule({
      imports: [AccessibilityToggleComponent]
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('high-contrast');
    document.documentElement.classList.remove('large-text');
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AccessibilityToggleComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create with both accessibility modes off by default', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.isHighContrast()).toBe(false);
    expect(component.isLargeText()).toBe(false);
  });

  it('should toggle high-contrast state and body class on toggleContrast', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.toggleContrast();
    expect(component.isHighContrast()).toBe(true);
    expect(document.body.classList.contains('high-contrast')).toBe(true);

    component.toggleContrast();
    expect(component.isHighContrast()).toBe(false);
    expect(document.body.classList.contains('high-contrast')).toBe(false);
  });

  it('should toggle large-text state and root element class on toggleFontSize', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.toggleFontSize();
    expect(component.isLargeText()).toBe(true);
    expect(document.documentElement.classList.contains('large-text')).toBe(true);

    component.toggleFontSize();
    expect(component.isLargeText()).toBe(false);
    expect(document.documentElement.classList.contains('large-text')).toBe(false);
  });

  it('should invoke toggleContrast when the contrast button is clicked', () => {
    const fixture = createComponent();
    spyOn(fixture.componentInstance, 'toggleContrast').and.callThrough();

    const contrastButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle High Contrast Mode"]'
    );
    contrastButton.click();

    expect(fixture.componentInstance.toggleContrast).toHaveBeenCalled();
  });

  it('should invoke toggleFontSize when the large-text button is clicked', () => {
    const fixture = createComponent();
    spyOn(fixture.componentInstance, 'toggleFontSize').and.callThrough();

    const fontButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle Large Text Mode"]'
    );
    fontButton.click();

    expect(fixture.componentInstance.toggleFontSize).toHaveBeenCalled();
    expect(fixture.componentInstance.isLargeText()).toBe(true);
  });

  it('should apply the active amber styling class to the contrast button once enabled', () => {
    const fixture = createComponent();
    fixture.componentInstance.toggleContrast();
    fixture.detectChanges();

    const contrastButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle High Contrast Mode"]'
    );
    expect(contrastButton.classList.contains('bg-amber-400')).toBe(true);
    expect(contrastButton.classList.contains('bg-slate-700')).toBe(false);
  });
});
