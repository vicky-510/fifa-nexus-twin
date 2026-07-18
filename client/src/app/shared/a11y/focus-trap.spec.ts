import { trapFocus } from './focus-trap';

describe('trapFocus', () => {
  let container: HTMLElement;
  let first: HTMLButtonElement;
  let middle: HTMLInputElement;
  let last: HTMLButtonElement;

  function tabEvent(shiftKey = false): KeyboardEvent {
    return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
  }

  beforeEach(() => {
    container = document.createElement('div');
    first = document.createElement('button');
    middle = document.createElement('input');
    last = document.createElement('button');
    container.append(first, middle, last);
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should ignore non-Tab keys', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should wrap focus from the last element to the first on Tab', () => {
    last.focus();
    const event = tabEvent();
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('should wrap focus from the first element to the last on Shift+Tab', () => {
    first.focus();
    const event = tabEvent(true);
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('should let Tab proceed normally between interior elements', () => {
    middle.focus();
    const event = tabEvent();
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should pull focus back inside when it has escaped the container', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const event = tabEvent();
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    outside.remove();
  });

  it('should be a no-op for a container with no focusable elements', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);
    const event = tabEvent();
    trapFocus(empty, event);
    expect(event.defaultPrevented).toBe(false);
    empty.remove();
  });

  it('should skip disabled controls when computing the trap boundaries', () => {
    last.disabled = true;
    middle.focus();
    const event = tabEvent();
    trapFocus(container, event);
    // With `last` disabled, `middle` is the final focusable element, so Tab wraps.
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });
});
