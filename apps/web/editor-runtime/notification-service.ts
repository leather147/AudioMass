(() => {
  type NotificationService = {
    show(text?: string, duration?: number, className?: string): HTMLElement;
  };
  type RuntimeWindow = typeof window & {
    AMNotifications?: NotificationService;
    OneUp?: (text?: string, duration?: number, className?: string) => void;
  };

  function show(text = '', duration = 720, className?: string) {
    const element = document.createElement('div');
    element.className = `pk_oneup pk_noselect${className ? ` ${className}` : ''}`;
    element.style.cssText = 'margin-top:20px;opacity:0';
    element.innerHTML = text || '';
    document.body.appendChild(element);

    setTimeout(() => {
      element.style.cssText = 'margin-top:0px;opacity:1';
      setTimeout(() => {
        element.style.cssText = 'margin-top:-20px;opacity:0';
        setTimeout(() => element.parentNode?.removeChild(element), 330);
      }, duration || 720);
    }, 25);
    return element;
  }

  const service: NotificationService = { show };
  const runtime = window as RuntimeWindow;
  runtime.AMNotifications = service;
  runtime.OneUp = (text, duration, className) => {
    service.show(text, duration, className);
  };
})();
