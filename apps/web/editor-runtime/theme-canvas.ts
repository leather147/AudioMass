(() => {
  type ThemePaint = {
    alpha(name: string, opacity: number, fallback: string): string;
    color(name: string, fallback: string): string;
    refresh(): void;
    remap(value: unknown): unknown;
  };

  type MarkedSetter = ((this: unknown, value: unknown) => void) & {
    __amThemePaint?: boolean;
  };
  type MarkedColorStop = ((this: CanvasGradient, offset: number, value: string) => void) & {
    __amThemePaint?: boolean;
  };
  type CanvasWindow = Window & {
    AMTheme?: { color(name: string, fallback?: string): string };
    AMThemePaint?: ThemePaint;
    CanvasGradient?: { prototype: CanvasGradient };
    CanvasRenderingContext2D?: { prototype: CanvasRenderingContext2D };
  };

  const runtimeWindow = window as CanvasWindow;

  function color(name: string, fallback: string) {
    return runtimeWindow.AMTheme?.color(name, fallback) ?? fallback;
  }

  function alpha(value: string, opacity: number) {
    const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
    if (hex) {
      let raw = hex[1]!;
      if (raw.length === 3) raw = raw.replace(/(.)/g, '$1$1');
      const number = Number.parseInt(raw, 16);
      return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${opacity})`;
    }
    const channels = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value);
    if (channels) return `rgba(${channels[1]},${channels[2]},${channels[3]},${opacity})`;
    return value;
  }

  function themedAlpha(name: string, opacity: number, fallback: string) {
    return alpha(color(name, fallback), opacity);
  }

  function normalise(value: string) {
    return value.toLowerCase().replace(/\s+/g, '');
  }

  function buildPalette() {
    const values: Record<string, string> = Object.create(null) as Record<string, string>;
    const add = (legacy: string[], themed: string) => {
      for (const value of legacy) values[normalise(value)] = themed;
    };

    add(
      ['#000', '#000000', '#050607', '#040506', '#09090b', '#101008'],
      color('wave-bg', '#050607'),
    );
    add(['#111', '#111111'], color('timeline-bg', '#080a0d'));
    add(['#fff', '#ffffff', '#f6f7f8'], color('foreground', '#f6f7f8'));
    add(
      ['#aaa', '#aaaaaa', '#ccc', '#cccccc', '#99c2c6', '#95c6c6'],
      color('muted-foreground', '#b2bcc8'),
    );
    add(['#686868', '#555', '#555555'], color('fg-2', '#7b8694'));
    add(['#43e4dc', '#5af2ff', '#56dbe3', '#5be1de'], color('ring', '#43e4dc'));
    add(['#d9d955', '#ffd15c', '#ffb35c'], color('warn', '#facc15'));
    add(['#ff0000', '#ff2222', '#ff3355', '#e13030', '#ad2b2b'], color('rec', '#ff4d5e'));
    add(
      ['#365457', '#2f7b75', '#336e70', '#3d6c62', '#5d6543', '#665164', '#4d6277'],
      color('accent-strong', 'rgba(67,228,220,.42)'),
    );
    add(
      ['#071010', '#0b1013', '#0d100d', '#100f0b', '#100d10', '#0d0f13'],
      color('card', '#080a0d'),
    );
    add(['#88c7c1', '#9dff6a'], color('marker-1', '#34d399'));
    add(['#7fb5b6'], color('marker-2', '#43e4dc'));
    add(['#83b0a4', '#f557d2'], color('marker-3', '#b993ff'));
    add(['#9aa47e'], color('marker-4', '#facc15'));
    add(['#a48aa0', '#ff8c35'], color('marker-5', '#ff4d5e'));
    add(['#879db1', '#b9c6ff'], color('marker-6', '#8ef1ec'));
    return values;
  }

  let currentPalette = buildPalette();

  function remapFunctionalColor(value: string) {
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value);
    if (!match) return value;
    const red = Number(match[1]);
    const green = Number(match[2]);
    const blue = Number(match[3]);
    const opacity = match[4] === undefined ? 1 : Number(match[4]);
    if (red < 40 && green < 40 && blue < 40) return themedAlpha('background', opacity, '#050607');
    if (Math.max(red, green, blue) - Math.min(red, green, blue) < 18)
      return themedAlpha('foreground', opacity, '#f6f7f8');
    if (green > 175 && blue > 170 && red < 175) return themedAlpha('ring', opacity, '#43e4dc');
    if (red > 180 && green > 135 && blue < 155) return themedAlpha('warn', opacity, '#facc15');
    if (red > 175 && green < 145 && blue < 150) return themedAlpha('rec', opacity, '#ff4d5e');
    return value;
  }

  function remap(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    return currentPalette[normalise(value)] ?? remapFunctionalColor(value);
  }

  function patchProperty(prototype: object, name: 'fillStyle' | 'shadowColor' | 'strokeStyle') {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    const originalSetter = descriptor?.set as MarkedSetter | undefined;
    if (!descriptor?.get || !originalSetter || originalSetter.__amThemePaint) return;
    const themedSetter = function (this: unknown, value: unknown) {
      originalSetter.call(this, remap(value));
    } as MarkedSetter;
    themedSetter.__amThemePaint = true;
    Object.defineProperty(prototype, name, {
      ...descriptor,
      set: themedSetter as (value: unknown) => void,
    });
  }

  const contextPrototype = runtimeWindow.CanvasRenderingContext2D?.prototype;
  if (contextPrototype) {
    patchProperty(contextPrototype, 'fillStyle');
    patchProperty(contextPrototype, 'strokeStyle');
    patchProperty(contextPrototype, 'shadowColor');
  }

  const gradientPrototype = runtimeWindow.CanvasGradient?.prototype;
  if (gradientPrototype) {
    const originalAddColorStop = gradientPrototype.addColorStop as MarkedColorStop;
    if (!originalAddColorStop.__amThemePaint) {
      const themedAddColorStop = function (this: CanvasGradient, offset: number, value: string) {
        originalAddColorStop.call(this, offset, remap(value) as string);
      } as MarkedColorStop;
      themedAddColorStop.__amThemePaint = true;
      gradientPrototype.addColorStop = themedAddColorStop as CanvasGradient['addColorStop'];
    }
  }

  const refresh = () => {
    currentPalette = buildPalette();
  };
  runtimeWindow.AMThemePaint = {
    color,
    alpha: themedAlpha,
    remap,
    refresh,
  };
  runtimeWindow.addEventListener('am:themechange', refresh);
})();
