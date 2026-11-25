(() => {
  'use strict';

  function enhance(input) {
    const control = document.createElement('div');
    control.className = 'number-stepper';
    const label = input.labels[0];
    if (label && !label.id) label.id = `${input.id}-label`;

    function createButton(direction, name, method) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `number-stepper__button number-stepper__button--${direction}`;
      button.setAttribute('aria-label', name);
      button.setAttribute('aria-controls', input.id);
      if (label) button.setAttribute('aria-describedby', label.id);
      button.addEventListener('click', () => {
        if (input.matches(':disabled') || input.readOnly) return;
        const value = input.value;
        const focused = document.activeElement === button;
        input[method]();
        if (input.value === value) return;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (focused && button.disabled) input.focus({ preventScroll: true });
      });
      return button;
    }

    const decrease = createButton('decrease', 'Giảm giá trị', 'stepDown');
    const increase = createButton('increase', 'Tăng giá trị', 'stepUp');
    input.before(control);
    control.append(decrease, input, increase);

    function sync() {
      const inactive = input.disabled || input.readOnly;
      const value = input.valueAsNumber;
      decrease.disabled = inactive || (input.min !== '' && value <= Number(input.min));
      increase.disabled = inactive || (input.max !== '' && value >= Number(input.max));
    }

    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    input.form?.addEventListener('reset', () => queueMicrotask(sync));
    new MutationObserver(sync).observe(input, { attributeFilter: ['disabled', 'readonly', 'min', 'max'] });
    sync();
  }

  const app = globalThis.IE104 ??= {};
  (app.ui ??= {}).numberStepper = { enhance };
})();
