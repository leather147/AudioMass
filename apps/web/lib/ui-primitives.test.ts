import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly classes = new Set<string>();
  className = '';
  innerHTML = '';
  parentNode: FakeElement | null = null;
  readonly style = { cssText: '' };
  private text = '';

  readonly classList = {
    add: (...names: string[]) => names.forEach((name) => this.classes.add(name)),
    toggle: (name: string, force?: boolean) => {
      const enabled = force ?? !this.classes.has(name);
      if (enabled) this.classes.add(name);
      else this.classes.delete(name);
      return enabled;
    },
  };

  get textContent() {
    return this.text;
  }

  set textContent(value: string) {
    this.text = value;
    this.children.splice(0);
  }

  appendChild(child: FakeElement) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  removeChild(child: FakeElement) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
}

type MenuChecks = {
  prepare(button: FakeElement | null, label?: string, checked?: boolean): void;
  set(button: FakeElement | null, checked?: boolean): void;
};

type Notifications = {
  show(text?: string, duration?: number, className?: string): FakeElement;
};

function runtime() {
  const body = new FakeElement();
  const timers: Array<{ callback: () => void; delay: number }> = [];
  const runtimeWindow = {} as {
    AMMenuCheckService?: MenuChecks;
    AMMenuChecks?: MenuChecks;
    AMNotifications?: Notifications;
    OneUp?: (text?: string, duration?: number, className?: string) => void;
  };
  const sandbox = {
    document: {
      body,
      createElement: () => new FakeElement(),
      createElementNS: () => new FakeElement(),
    },
    setTimeout(callback: () => void, delay: number) {
      timers.push({ callback, delay });
      return timers.length;
    },
    window: runtimeWindow,
  };
  for (const asset of ['notification-service.js', 'menu-check-service.js']) {
    runInNewContext(
      readFileSync(join(process.cwd(), 'public', 'editor-assets', asset), 'utf8'),
      sandbox,
    );
  }
  return { body, runtimeWindow, timers };
}

describe('generated editor UI primitives', () => {
  it('preserves OneUp classes, animation timing, and removal lifecycle', () => {
    const testRuntime = runtime();
    testRuntime.runtimeWindow.OneUp?.('<strong>Saved</strong>', 0, 'pk_gr');

    const notification = testRuntime.body.children[0]!;
    expect(testRuntime.runtimeWindow.AMNotifications).toBeDefined();
    expect(notification.className).toBe('pk_oneup pk_noselect pk_gr');
    expect(notification.innerHTML).toBe('<strong>Saved</strong>');
    expect(notification.style.cssText).toBe('margin-top:20px;opacity:0');
    expect(testRuntime.timers[0]?.delay).toBe(25);

    testRuntime.timers.shift()!.callback();
    expect(notification.style.cssText).toBe('margin-top:0px;opacity:1');
    expect(testRuntime.timers[0]?.delay).toBe(720);
    testRuntime.timers.shift()!.callback();
    expect(notification.style.cssText).toBe('margin-top:-20px;opacity:0');
    expect(testRuntime.timers[0]?.delay).toBe(330);
    testRuntime.timers.shift()!.callback();
    expect(testRuntime.body.children).toHaveLength(0);
  });

  it('prepares accessible menu checkboxes with the established SVG indicator', () => {
    const testRuntime = runtime();
    const service = testRuntime.runtimeWindow.AMMenuChecks!;
    expect(service).toBe(testRuntime.runtimeWindow.AMMenuCheckService);
    const button = new FakeElement();
    button.appendChild(new FakeElement());

    service.prepare(button, 'Follow cursor', true);
    expect(button.classes).toEqual(new Set(['pk_menu_checkable', 'pk_menu_checked']));
    expect(button.getAttribute('role')).toBe('menuitemcheckbox');
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.children).toHaveLength(2);
    expect(button.children[0]).toMatchObject({
      className: 'pk_menu_label',
      textContent: 'Follow cursor',
    });
    const indicator = button.children[1]!;
    expect(indicator.className).toBe('pk_menu_check_svg');
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    expect(indicator.children[0]?.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(indicator.children[0]?.children[0]?.getAttribute('d')).toBe(
      'M3.25 8.25L6.65 11.55L12.85 4.45',
    );

    service.set(button, false);
    expect(button.classes.has('pk_menu_checked')).toBe(false);
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(() => service.set(null, true)).not.toThrow();
  });
});
