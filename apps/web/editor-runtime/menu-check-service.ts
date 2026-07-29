(() => {
  type MenuCheckService = {
    prepare(button: HTMLElement | null, label?: string, checked?: boolean): void;
    set(button: HTMLElement | null, checked?: boolean): void;
  };
  type RuntimeWindow = typeof window & {
    AMMenuCheckService?: MenuCheckService;
    AMMenuChecks?: MenuCheckService;
  };

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

  function makeIndicator() {
    const indicator = document.createElement('span');
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    indicator.className = 'pk_menu_check_svg';
    indicator.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('focusable', 'false');
    path.setAttribute('d', 'M3.25 8.25L6.65 11.55L12.85 4.45');
    svg.appendChild(path);
    indicator.appendChild(svg);
    return indicator;
  }

  function setChecked(button: HTMLElement | null, checked = false) {
    if (!button) return;
    button.classList.toggle('pk_menu_checked', Boolean(checked));
    button.setAttribute('aria-checked', checked ? 'true' : 'false');
  }

  function prepare(button: HTMLElement | null, label = '', checked = false) {
    if (!button) return;
    button.textContent = '';
    button.classList.add('pk_menu_checkable');
    button.setAttribute('role', 'menuitemcheckbox');
    const text = document.createElement('span');
    text.className = 'pk_menu_label';
    text.textContent = label || '';
    button.appendChild(text);
    button.appendChild(makeIndicator());
    setChecked(button, checked);
  }

  const service: MenuCheckService = { prepare, set: setChecked };
  const runtime = window as RuntimeWindow;
  runtime.AMMenuCheckService = service;
  runtime.AMMenuChecks = service;
})();
