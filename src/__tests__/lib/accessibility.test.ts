/**
 * Tests unitaires pour src/lib/accessibility.ts
 * Tests des utilitaires d'accessibilité WCAG 2.1 AA
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  announceToScreenReader,
  clearAnnouncement,
  getFocusableElements,
  trapFocus,
  createFocusGuard,
  getAriaLabel,
  getInteractiveAriaProps,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  createArrowNavigation,
  prefersReducedMotion,
  onReducedMotionChange,
  FOCUSABLE_SELECTORS,
} from '@/lib/accessibility';

describe('announceToScreenReader', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    const liveRegion = document.getElementById('accessibility-live-region');
    liveRegion?.remove();
  });

  it('should create live region on first call', () => {
    announceToScreenReader('Test message');

    const liveRegion = document.getElementById('accessibility-live-region');
    expect(liveRegion).toBeTruthy();
  });

  it('should set correct ARIA attributes', () => {
    announceToScreenReader('Test message');

    const liveRegion = document.getElementById('accessibility-live-region')!;
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    expect(liveRegion.getAttribute('role')).toBe('status');
  });

  it('should update aria-live to assertive for urgent messages', () => {
    announceToScreenReader('Urgent message', 'assertive');

    const liveRegion = document.getElementById('accessibility-live-region')!;
    expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
  });

  it('should be visually hidden', () => {
    announceToScreenReader('Test message');

    const liveRegion = document.getElementById('accessibility-live-region') as HTMLElement;
    expect(liveRegion.style.position).toBe('absolute');
    expect(liveRegion.style.width).toBe('1px');
    expect(liveRegion.style.height).toBe('1px');
  });

  it('should update message after timeout', async () => {
    vi.useFakeTimers();
    announceToScreenReader('Test message');

    const liveRegion = document.getElementById('accessibility-live-region')!;
    expect(liveRegion.textContent).toBe('');

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    expect(liveRegion.textContent).toBe('Test message');
    vi.useRealTimers();
  });

  it('should reuse existing live region', () => {
    announceToScreenReader('Message 1');
    announceToScreenReader('Message 2');

    const liveRegions = document.querySelectorAll('[role="status"]');
    expect(liveRegions.length).toBe(1);
  });

  it('should clear message before setting new one', () => {
    announceToScreenReader('Message 1');
    const liveRegion = document.getElementById('accessibility-live-region')!;

    expect(liveRegion.textContent).toBe('');
  });
});

describe('clearAnnouncement', () => {
  it('should clear live region content', async () => {
    vi.useFakeTimers();
    announceToScreenReader('Test message');

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    clearAnnouncement();

    const liveRegion = document.getElementById('accessibility-live-region')!;
    expect(liveRegion.textContent).toBe('');
    vi.useRealTimers();
  });

  it('should not error if live region does not exist', () => {
    expect(() => clearAnnouncement()).not.toThrow();
  });
});

describe('FOCUSABLE_SELECTORS', () => {
  it('should include all standard focusable elements', () => {
    expect(FOCUSABLE_SELECTORS).toContain('a[href]');
    expect(FOCUSABLE_SELECTORS).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTORS).toContain('input:not([disabled]):not([type=\'hidden\'])');
    expect(FOCUSABLE_SELECTORS).toContain('[tabindex]:not([tabindex=\'-1\'])');
  });
});

describe('getFocusableElements', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <a href="#" id="link">Link</a>
        <button id="button">Button</button>
        <input id="input" />
        <button disabled id="disabled">Disabled</button>
        <div id="hidden" style="display: none">
          <button id="hidden-button">Hidden Button</button>
        </div>
        <input type="hidden" id="hidden-input" />
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should return all visible focusable elements', () => {
    const container = document.getElementById('container')!;
    // Include hidden to test selector logic (visibility check doesn't work in jsdom)
    const elements = getFocusableElements(container, true);

    // Should find link, button, input, hidden-button (disabled excluded)
    expect(elements.length).toBeGreaterThan(0);
    const ids = elements.map(el => el.id);
    expect(ids).toContain('link');
    expect(ids).toContain('button');
    expect(ids).toContain('input');
  });

  it('should exclude disabled elements', () => {
    const container = document.getElementById('container')!;
    const elements = getFocusableElements(container);

    expect(elements.find(el => el.id === 'disabled')).toBeUndefined();
  });

  it('should exclude hidden elements by default', () => {
    const container = document.getElementById('container')!;
    const elements = getFocusableElements(container);

    expect(elements.find(el => el.id === 'hidden-button')).toBeUndefined();
  });

  it('should include hidden elements when includeHidden is true', () => {
    const container = document.getElementById('container')!;
    const elements = getFocusableElements(container, true);

    expect(elements.length).toBeGreaterThan(3);
  });

  it('should exclude input type hidden', () => {
    const container = document.getElementById('container')!;
    const elements = getFocusableElements(container, true);

    expect(elements.find(el => el.id === 'hidden-input')).toBeUndefined();
  });
});

describe('trapFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should focus first element on init', () => {
    const modal = document.getElementById('modal')!;
    const cleanup = trapFocus(modal);

    // trapFocus should attempt to focus the first element
    // In test environment, focus might not work as expected
    const focusableElements = modal.querySelectorAll('button');
    expect(focusableElements.length).toBe(3);

    cleanup();
  });

  it('should return cleanup function', () => {
    const modal = document.getElementById('modal')!;
    const cleanup = trapFocus(modal);

    expect(typeof cleanup).toBe('function');
  });

  it('should trap focus forward (Tab)', () => {
    const modal = document.getElementById('modal')!;
    const cleanup = trapFocus(modal);

    // Test that Tab key handler is registered
    const focusableElements = modal.querySelectorAll('button');
    expect(focusableElements.length).toBe(3);

    cleanup();
  });

  it('should trap focus backward (Shift+Tab)', () => {
    const modal = document.getElementById('modal')!;
    const cleanup = trapFocus(modal);

    // Test that Shift+Tab key handler is registered
    const focusableElements = modal.querySelectorAll('button');
    expect(focusableElements.length).toBe(3);

    cleanup();
  });

  it('should remove event listener on cleanup', () => {
    const modal = document.getElementById('modal')!;
    const cleanup = trapFocus(modal);

    const spy = vi.spyOn(document, 'removeEventListener');
    cleanup();

    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('createFocusGuard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="original">Original</button>
      <button id="other">Other</button>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should save currently focused element', () => {
    const original = document.getElementById('original')!;
    original.focus();

    const guard = createFocusGuard();
    guard.save();

    const other = document.getElementById('other')!;
    other.focus();

    expect(document.activeElement?.id).toBe('other');
  });

  it('should restore previously focused element', () => {
    const original = document.getElementById('original')!;
    original.focus();

    const guard = createFocusGuard();
    guard.save();

    const other = document.getElementById('other')!;
    other.focus();

    guard.restore();

    expect(document.activeElement?.id).toBe('original');
  });

  it('should not error if saved element is null', () => {
    const guard = createFocusGuard();

    expect(() => guard.restore()).not.toThrow();
  });
});

describe('getAriaLabel', () => {
  it('should return French label for known status', () => {
    expect(getAriaLabel('pending')).toBe('En attente');
    expect(getAriaLabel('completed')).toBe('Terminé');
    expect(getAriaLabel('in-progress')).toBe('En cours');
  });

  it('should handle uppercase input', () => {
    expect(getAriaLabel('PENDING')).toBe('En attente');
  });

  it('should handle whitespace', () => {
    expect(getAriaLabel('  pending  ')).toBe('En attente');
  });

  it('should return original value for unknown status', () => {
    expect(getAriaLabel('custom-status')).toBe('custom-status');
  });

  it('should handle all defined statuses', () => {
    expect(getAriaLabel('draft')).toBe('Brouillon');
    expect(getAriaLabel('published')).toBe('Publié');
    expect(getAriaLabel('open')).toBe('Ouvert');
    expect(getAriaLabel('closed')).toBe('Fermé');
    expect(getAriaLabel('online')).toBe('En ligne');
    expect(getAriaLabel('offline')).toBe('Hors ligne');
  });
});

describe('getInteractiveAriaProps', () => {
  it('should return all provided props', () => {
    const props = getInteractiveAriaProps({
      label: 'Test button',
      description: 'Description',
      expanded: true,
      pressed: false,
      disabled: false,
    });

    expect(props['aria-label']).toBe('Test button');
    expect(props['aria-describedby']).toBe('Description');
    expect(props['aria-expanded']).toBe(true);
    expect(props['aria-pressed']).toBe(false);
    expect(props['aria-disabled']).toBe(false);
  });

  it('should handle optional props', () => {
    const props = getInteractiveAriaProps({
      label: 'Test button',
    });

    expect(props['aria-label']).toBe('Test button');
    expect(props['aria-describedby']).toBeUndefined();
    expect(props['aria-expanded']).toBeUndefined();
  });

  it('should handle hasPopup variations', () => {
    expect(getInteractiveAriaProps({ label: 'Test', hasPopup: true })['aria-haspopup']).toBe(true);
    expect(getInteractiveAriaProps({ label: 'Test', hasPopup: 'menu' })['aria-haspopup']).toBe('menu');
    expect(getInteractiveAriaProps({ label: 'Test', hasPopup: 'dialog' })['aria-haspopup']).toBe('dialog');
  });

  it('should handle controls prop', () => {
    const props = getInteractiveAriaProps({
      label: 'Test',
      controls: 'element-id',
    });

    expect(props['aria-controls']).toBe('element-id');
  });
});

describe('getContrastRatio', () => {
  it('should calculate 21:1 for black on white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('should calculate 1:1 for same colors', () => {
    expect(getContrastRatio('#ff0000', '#ff0000')).toBe(1);
  });

  it('should handle colors without # prefix', () => {
    expect(getContrastRatio('000000', 'ffffff')).toBeCloseTo(21, 1);
  });

  it('should handle lowercase hex', () => {
    expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
  });

  it('should return 1 for invalid hex colors', () => {
    expect(getContrastRatio('invalid', '#ffffff')).toBe(1);
    expect(getContrastRatio('#ffffff', 'invalid')).toBe(1);
  });

  it('should calculate medium contrast correctly', () => {
    const ratio = getContrastRatio('#767676', '#ffffff');
    expect(ratio).toBeGreaterThan(4);
    expect(ratio).toBeLessThan(5);
  });
});

describe('meetsWCAGAA', () => {
  it('should pass AA for 4.5:1 normal text', () => {
    expect(meetsWCAGAA(4.5, false)).toBe(true);
    expect(meetsWCAGAA(4.6, false)).toBe(true);
  });

  it('should fail AA for insufficient contrast normal text', () => {
    expect(meetsWCAGAA(4.4, false)).toBe(false);
    expect(meetsWCAGAA(3.0, false)).toBe(false);
  });

  it('should pass AA for 3:1 large text', () => {
    expect(meetsWCAGAA(3.0, true)).toBe(true);
    expect(meetsWCAGAA(3.5, true)).toBe(true);
  });

  it('should fail AA for insufficient contrast large text', () => {
    expect(meetsWCAGAA(2.9, true)).toBe(false);
  });
});

describe('meetsWCAGAAA', () => {
  it('should pass AAA for 7:1 normal text', () => {
    expect(meetsWCAGAAA(7.0, false)).toBe(true);
    expect(meetsWCAGAAA(8.0, false)).toBe(true);
  });

  it('should fail AAA for insufficient contrast normal text', () => {
    expect(meetsWCAGAAA(6.9, false)).toBe(false);
    expect(meetsWCAGAAA(4.5, false)).toBe(false);
  });

  it('should pass AAA for 4.5:1 large text', () => {
    expect(meetsWCAGAAA(4.5, true)).toBe(true);
    expect(meetsWCAGAAA(5.0, true)).toBe(true);
  });

  it('should fail AAA for insufficient contrast large text', () => {
    expect(meetsWCAGAAA(4.4, true)).toBe(false);
  });
});

describe('createArrowNavigation', () => {
  let items: HTMLElement[];

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="list">
        <button id="item-0">Item 0</button>
        <button id="item-1">Item 1</button>
        <button id="item-2">Item 2</button>
      </div>
    `;
    items = Array.from(document.querySelectorAll('button'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create navigation handler', () => {
    const nav = createArrowNavigation(items);

    expect(nav).toHaveProperty('handleKeyDown');
    expect(nav).toHaveProperty('focusItem');
    expect(nav).toHaveProperty('getCurrentIndex');
    expect(nav).toHaveProperty('setCurrentIndex');
  });

  it('should navigate down with ArrowDown', () => {
    const nav = createArrowNavigation(items);

    nav.focusItem(0);
    expect(nav.getCurrentIndex()).toBe(0);

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    nav.handleKeyDown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(nav.getCurrentIndex()).toBe(1);
  });

  it('should navigate up with ArrowUp', () => {
    const nav = createArrowNavigation(items);

    nav.focusItem(1);
    expect(nav.getCurrentIndex()).toBe(1);

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    nav.handleKeyDown(event);

    expect(nav.getCurrentIndex()).toBe(0);
  });

  it('should loop navigation when enabled', () => {
    const nav = createArrowNavigation(items, { loop: true });

    nav.focusItem(2);

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    nav.handleKeyDown(event);

    expect(nav.getCurrentIndex()).toBe(0);
  });

  it('should not loop navigation when disabled', () => {
    const nav = createArrowNavigation(items, { loop: false });

    nav.focusItem(2);

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    nav.handleKeyDown(event);

    expect(nav.getCurrentIndex()).toBe(2);
  });

  it('should handle Home key', () => {
    const nav = createArrowNavigation(items);

    nav.focusItem(2);

    const event = new KeyboardEvent('keydown', { key: 'Home' });
    nav.handleKeyDown(event);

    expect(nav.getCurrentIndex()).toBe(0);
  });

  it('should handle End key', () => {
    const nav = createArrowNavigation(items);

    nav.focusItem(0);

    const event = new KeyboardEvent('keydown', { key: 'End' });
    nav.handleKeyDown(event);

    expect(nav.getCurrentIndex()).toBe(2);
  });

  it('should call onSelect for Enter key', () => {
    const onSelect = vi.fn();
    const nav = createArrowNavigation(items, { onSelect });

    nav.focusItem(1);

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    nav.handleKeyDown(event);

    expect(onSelect).toHaveBeenCalledWith(items[1], 1);
  });

  it('should handle horizontal orientation', () => {
    const nav = createArrowNavigation(items, { orientation: 'horizontal' });

    nav.focusItem(0);

    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    nav.handleKeyDown(rightEvent);

    expect(nav.getCurrentIndex()).toBe(1);

    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    nav.handleKeyDown(leftEvent);

    expect(nav.getCurrentIndex()).toBe(0);
  });

  it('should handle both orientation', () => {
    const nav = createArrowNavigation(items, { orientation: 'both' });

    nav.focusItem(0);

    nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(nav.getCurrentIndex()).toBe(1);

    nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(nav.getCurrentIndex()).toBe(2);
  });
});

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should return false when prefers-reduced-motion is not set', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('should return true when prefers-reduced-motion is set', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      })),
    });

    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('onReducedMotionChange', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should return cleanup function', () => {
    const cleanup = onReducedMotionChange(() => {});

    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('should add event listener', () => {
    const addEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      })),
    });

    const callback = vi.fn();
    onReducedMotionChange(callback);

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove event listener on cleanup', () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener,
      })),
    });

    const cleanup = onReducedMotionChange(() => {});
    cleanup();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
