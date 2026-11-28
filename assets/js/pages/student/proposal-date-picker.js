(() => {
  const form = document.querySelector('#proposal-form, .teacher-topic-form');
  const app = globalThis.IE104;
  const pickers = app?.ui?.proposalPickers;
  if (!pickers) return;

  const fullDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeZone: 'UTC' });
  const dateAt = (year, month, day) => {
    const date = new Date(0);
    date.setUTCFullYear(year, month, day);
    return date;
  };
  const isoDate = date => date.toISOString().slice(0, 10);
  const displayDate = iso => iso.split('-').reverse().join('/');
  const inRange = date => date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999;
  const dayOfWeek = date => (date.getUTCDay() + 6) % 7;
  const addDays = (date, days) => dateAt(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days);
  const addMonths = (date, months) => {
    const start = dateAt(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
    const last = dateAt(start.getUTCFullYear(), start.getUTCMonth() + 1, 0);
    return addDays(start, Math.min(date.getUTCDate(), last.getUTCDate()) - 1);
  };

  function parseDate(value) {
    let iso = value.trim();
    const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(iso) || /^(\d{2})(\d{2})(\d{4})$/.exec(iso);
    if (parts) iso = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const date = new Date(`${iso}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && inRange(date) && isoDate(date) === iso ? date : null;
  }

  function formatDateInput(event) {
    const input = event.currentTarget;
    const value = input.value;
    // Keep native deletions and edits within an existing date.
    if (!event.inputType?.startsWith('insert') || event.isComposing || input.selectionStart !== value.length) return;
    if (!/^(?:\d{2}[ /]*){0,2}\d{0,4}$/.test(value)) return;

    const digits = value.replace(/[ /]/g, '');
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4);
    let formatted = day;
    if (day.length === 2) formatted += `/${month}`;
    if (month.length === 2) formatted += `/${year}`;
    if (formatted !== value) input.value = formatted;
  }

  function parseTime(value) {
    const parts = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
    return parts && Number(parts[1]) <= 23 ? `${parts[1].padStart(2, '0')}:${parts[2]}` : '';
  }

  function parseDateTime(day, clock) {
    const date = parseDate(day);
    const time = parseTime(clock);
    return date && time ? `${isoDate(date)}T${time}` : '';
  }

  const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const calendarIcon = icon('M20 7v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2ZM8 3v4m8-4v4M4 10h16');
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const enhanced = new WeakSet();
  const dateTimeFields = new WeakMap();
  const vietnamClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });

  function vietnamDateTime(timestamp) {
    const parts = Object.fromEntries(vietnamClock.formatToParts(timestamp).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function fillEnhancedDate(input, value) {
    const [day, time = ''] = value.split('T');
    input.value = day ? displayDate(day) : '';
    const timeInput = dateTimeFields.get(input);
    if (timeInput) timeInput.value = time;
  }

  function createTimeColumn(list, count, onSelect) {
    const options = Array.from({ length: count }, (_, index) => {
      const option = document.createElement('div');
      option.id = `${list.id}-${index}`;
      option.textContent = String(index).padStart(2, '0');
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      return option;
    });
    list.append(...options);
    let selected = -1;
    let active = 0;
    let minimum = 0;

    function activate(index) {
      options[active].classList.remove('is-active');
      active = index;
      const option = options[index];
      option.classList.add('is-active');
      list.setAttribute('aria-activedescendant', option.id);
      if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    }

    function select(index) {
      options[selected]?.setAttribute('aria-selected', 'false');
      selected = index;
      options[selected]?.setAttribute('aria-selected', 'true');
      activate(Math.max(minimum, selected));
    }

    list.addEventListener('click', event => {
      const index = options.indexOf(event.target.closest('[role="option"]'));
      if (index < minimum) return;
      list.focus({ preventScroll: true });
      select(index);
      onSelect();
    });
    list.addEventListener('keydown', event => {
      const { key } = event;
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(key)) return;
      event.preventDefault();
      if (key === 'Enter' || key === ' ') {
        select(active);
        onSelect();
      } else if (key === 'End') activate(count - 1);
      else if (key === 'Home') activate(minimum);
      else if (key === 'ArrowUp') activate(Math.max(minimum, active - 1));
      else activate(Math.min(count - 1, active + 1));
    });
    return {
      get value() { return options[selected]?.textContent || ''; },
      set value(value) { select(value ? Number(value) : -1); },
      reveal() { activate(active); },
      setMinimum(index) {
        if (index === minimum) return;
        minimum = index;
        options.forEach((option, index) => {
          if (index < minimum) option.setAttribute('aria-disabled', 'true');
          else option.removeAttribute('aria-disabled');
        });
        if (selected >= 0 && selected < minimum) select(-1);
        else if (active < minimum) activate(minimum);
      },
    };
  }

  function enhanceDate(input, { timeZone, timeLabel = 'Giờ hết hạn đăng ký', label = input.labels[0], preferAbove = false, todayValue } = {}) {
    if (enhanced.has(input)) return;
    const group = document.createElement('div');
    group.className = 'proposal-date-control';
    input.before(group);
    group.append(input);
    const initial = input.value;
    const withTime = input.type === 'datetime-local';
    const onlyMonth = input.type === 'month' || input.getAttribute('type') === 'month';
    if (onlyMonth) {
      input.hidden = true;
    } else {
      input.type = 'text';
      input.inputMode = 'numeric';
      input.placeholder = 'dd/mm/yyyy';
      input.maxLength = 10;
      input.autocomplete = 'off';
    }
    enhanced.add(input);
    if (withTime) {
      group.classList.add('proposal-date-control--with-time');
      group.insertAdjacentHTML('beforeend', `
        <span class="proposal-date-separator" aria-hidden="true">·</span>
        <input class="proposal-date-time" type="text" placeholder="hh:mm" maxlength="5" autocomplete="off">
      `);
    }
    const timeInput = group.querySelector('.proposal-date-time');
    if (timeInput) {
      timeInput.setAttribute('aria-label', timeLabel);
      timeInput.required = input.required;
      dateTimeFields.set(input, timeInput);
    }
    if (!onlyMonth) {
      fillEnhancedDate(input, initial);
      input.defaultValue = input.value;
      if (timeInput) timeInput.defaultValue = timeInput.value;
    }

    label.id ||= `${input.id}-label`;
    const panelId = `${input.id}-calendar`;
    const headingId = `${panelId}-heading`;
    group.insertAdjacentHTML('beforeend', `
      ${onlyMonth ? `
      <button type="button" id="${input.id}-picker" class="proposal-month-trigger" aria-haspopup="dialog"
        aria-labelledby="${label.id} ${input.id}-display">
        <span id="${input.id}-display"></span>
        ${calendarIcon}
      </button>` : `
      <button type="button" class="proposal-date-trigger" aria-haspopup="dialog">
        ${calendarIcon}
      </button>`}
      <div id="${panelId}" class="proposal-picker-popup proposal-calendar${withTime ? ' proposal-calendar--with-time' : ''}" role="dialog"
        aria-labelledby="${label.id}">
        <div class="proposal-calendar__header">
          ${onlyMonth ? `<div class="proposal-calendar__heading"><span aria-live="polite"></span></div>` : `
          <button type="button" id="${headingId}" class="proposal-calendar__heading"
            aria-expanded="false" aria-controls="${panelId}-months">
            <span aria-live="polite"></span>${icon('m7 10 5 5 5-5')}
          </button>`}
          <div class="proposal-calendar__navigation">
            <button type="button" data-step="-1" aria-label="Tháng trước">${icon('m14 6-6 6 6 6')}</button>
            <button type="button" data-step="1" aria-label="Tháng sau">${icon('m10 6 6 6-6 6')}</button>
          </div>
        </div>
        <div class="proposal-calendar__body">
          <div id="${panelId}-months" class="proposal-calendar__months" hidden>
            <label>Năm <input type="number" inputmode="numeric" min="1" max="9999" step="1"></label>
            <div class="proposal-calendar__month-grid"></div>
          </div>
          ${onlyMonth ? '' : `<table class="proposal-calendar__grid" role="grid" aria-labelledby="${headingId}">
            <thead><tr>${weekdays.map(day => `<th scope="col">${day}</th>`).join('')}</tr></thead>
            <tbody></tbody>
          </table>`}
        </div>
        ${withTime ? `
          <div class="proposal-calendar__time">
            <div class="proposal-calendar__time-column">
              <span id="${panelId}-hours-label">Giờ</span>
              <div id="${panelId}-hours" class="proposal-calendar__time-options" role="listbox" tabindex="0"
                aria-labelledby="${panelId}-hours-label"></div>
            </div>
            <div class="proposal-calendar__time-column">
              <span id="${panelId}-minutes-label">Phút</span>
              <div id="${panelId}-minutes" class="proposal-calendar__time-options" role="listbox" tabindex="0"
                aria-labelledby="${panelId}-minutes-label"></div>
            </div>
          </div>
        ` : ''}
        <div class="proposal-calendar__footer">
          ${onlyMonth ? '' : '<button type="button" data-clear-date>Xóa</button>'}
          <button type="button" data-today>Hôm nay</button>
        </div>
      </div>
    `);
    const trigger = group.querySelector('.proposal-date-trigger, .proposal-month-trigger');
    if (onlyMonth) label.htmlFor = trigger.id;
    else {
      const text = globalThis.IE104Language?.sourceText(label.firstChild) ?? label.firstChild.textContent;
      trigger.setAttribute('aria-label', `Mở lịch: ${text.trim()}`);
    }
    const monthLabel = onlyMonth ? trigger.querySelector('span') : null;
    const panel = group.querySelector('.proposal-calendar');
    const body = panel.querySelector('.proposal-calendar__body');
    const popup = pickers.setupPopup(group, trigger, panel, { scrollArea: body, preferAbove });
    const heading = panel.querySelector('.proposal-calendar__heading');
    const title = heading.querySelector('span');
    const navigation = [...panel.querySelectorAll('[data-step]')];
    const jump = panel.querySelector('.proposal-calendar__months');
    const yearField = jump.querySelector('input');
    const monthGrid = jump.querySelector('.proposal-calendar__month-grid');
    const grid = panel.querySelector('table');
    const gridBody = grid?.tBodies[0];
    const clear = panel.querySelector('[data-clear-date]');
    const todayButton = panel.querySelector('[data-today]');
    const hours = withTime && createTimeColumn(panel.querySelector(`#${panelId}-hours`), 24, updateDateTime);
    const minutes = withTime && createTimeColumn(panel.querySelector(`#${panelId}-minutes`), 60, updateDateTime);
    let today;
    let minimumDate = '';
    let minimumTime = '';
    let selected;
    let active;

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = document.createElement('button');
      month.type = 'button';
      month.textContent = `Tháng ${index + 1}`;
      month.addEventListener('click', () => {
        setYear();
        active = dateAt(active.getUTCFullYear(), index, 1);
        if (onlyMonth) choose(isoDate(active));
        else {
          showMonths(false);
          focusDay();
        }
      });
      return month;
    });
    monthGrid.append(...months);

    function refreshBounds() {
      if (onlyMonth) return;
      const now = Date.now();
      today = parseDate(vietnamDateTime(now).slice(0, 10));
      const earliest = withTime ? vietnamDateTime((Math.floor(now / 60000) + 1) * 60000) : isoDate(today);
      [minimumDate, minimumTime = ''] = earliest.split('T');
      if (!active || isoDate(active) < minimumDate) active = parseDate(minimumDate);
      if (selected && selected < minimumDate) selected = '';
      if (withTime) {
        const [hour, minute] = minimumTime.split(':').map(Number);
        hours.setMinimum(selected === minimumDate ? hour : 0);
        minutes.setMinimum(selected === minimumDate && hours.value && Number(hours.value) === hour ? minute : 0);
      }
    }

    function render() {
      refreshBounds();
      const year = active.getUTCFullYear();
      const month = active.getUTCMonth();
      title.textContent = onlyMonth ? `Năm ${year}` : `Tháng ${month + 1} năm ${year}`;
      const firstYear = minimumDate ? Number(minimumDate.slice(0, 4)) : 1;
      const firstMonth = minimumDate ? Number(minimumDate.slice(5, 7)) - 1 : 0;
      navigation[0].disabled = year === firstYear && (!jump.hidden || month === firstMonth);
      navigation[1].disabled = year === 9999 && (!jump.hidden || month === 11);
      todayButton.disabled = isoDate(today) < minimumDate;
      updateActions();
      if (!jump.hidden) {
        yearField.min = firstYear;
        yearField.value = year;
        months.forEach((button, index) => {
          button.disabled = year === firstYear && index < firstMonth;
          button.setAttribute('aria-pressed', String(onlyMonth
            ? input.value === isoDate(dateAt(year, index, 1)).slice(0, 7)
            : index === month));
        });
        popup.place();
        return;
      }
      const start = dateAt(year, month, 1);
      const first = addDays(start, -dayOfWeek(start));
      const rows = Array.from({ length: 6 }, (_, week) => {
        const row = document.createElement('tr');
        for (let day = 0; day < 7; day++) {
          const date = addDays(first, week * 7 + day);
          const cell = document.createElement('td');
          row.append(cell);
          if (!inRange(date)) continue;
          const value = isoDate(date);
          const button = document.createElement('button');
          cell.setAttribute('aria-selected', String(value === selected));
          button.type = 'button';
          button.dataset.date = value;
          button.textContent = date.getUTCDate();
          button.disabled = value < minimumDate;
          button.tabIndex = date.getTime() === active.getTime() ? 0 : -1;
          button.setAttribute('aria-label', fullDate.format(date));
          if (date.getUTCMonth() !== month) button.classList.add('is-outside-month');
          if (value === isoDate(today)) button.setAttribute('aria-current', 'date');
          cell.append(button);
        }
        return row;
      });
      gridBody.replaceChildren(...rows);
      popup.place();
    }

    function focusDay() {
      gridBody.querySelector('button[tabindex="0"]')?.focus({ preventScroll: true });
      const day = document.activeElement;
      if (gridBody.contains(day)) {
        const cell = day.getBoundingClientRect();
        const bounds = body.getBoundingClientRect();
        if (cell.bottom > bounds.bottom) body.scrollTop += cell.bottom - bounds.bottom + 4;
        if (cell.top < bounds.top) body.scrollTop -= bounds.top - cell.top + 4;
      }
    }

    function showMonths(show) {
      body.scrollTop = 0;
      jump.hidden = !show;
      if (grid) {
        grid.hidden = show;
        heading.setAttribute('aria-expanded', String(show));
      }
      navigation[0].setAttribute('aria-label', show ? 'Năm trước' : 'Tháng trước');
      navigation[1].setAttribute('aria-label', show ? 'Năm sau' : 'Tháng sau');
      render();
    }

    function setYear() {
      const year = yearField.valueAsNumber;
      if (Number.isInteger(year) && year >= 1 && year <= 9999) {
        active = addMonths(active, (year - active.getUTCFullYear()) * 12);
      }
      render();
    }

    function close() {
      popup.close();
      trigger.focus({ preventScroll: true });
    }

    function open() {
      if (onlyMonth) {
        const now = new Date();
        const local = new Intl.DateTimeFormat('vi-VN', {
          timeZone, day: '2-digit', month: '2-digit', year: 'numeric',
        }).format(now);
        today = parseDate(todayValue?.() || local) || dateAt(now.getFullYear(), now.getMonth(), now.getDate());
      }
      const date = parseDate(onlyMonth ? `${input.value}-01` : input.value);
      selected = date ? isoDate(date) : '';
      active = date || (onlyMonth ? today : null);
      if (withTime) {
        const [hour = '', minute = ''] = parseTime(timeInput.value).split(':');
        hours.value = hour;
        minutes.value = minute;
      }
      showMonths(onlyMonth);
      popup.open();
      if (withTime) {
        hours.reveal();
        minutes.reveal();
      }
      if (onlyMonth) months[active.getUTCMonth()].focus({ preventScroll: true });
      else focusDay();
    }

    function commit(value) {
      if (onlyMonth) {
        input.value = value.slice(0, 7);
        syncMonthLabel();
      } else {
        fillEnhancedDate(input, value);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateActions() {
      if (clear) clear.disabled = !(input.value || timeInput?.value || (withTime && (selected || hours.value || minutes.value)));
    }

    function syncMonthLabel() {
      const date = parseDate(`${input.value}-01`);
      const text = date ? `Tháng ${date.getUTCMonth() + 1} năm ${date.getUTCFullYear()}` : 'Chọn tháng';
      if ((globalThis.IE104Language?.sourceText(monthLabel) ?? monthLabel.textContent) !== text) monthLabel.textContent = text;
    }

    function updateDateTime() {
      refreshBounds();
      const value = parseDateTime(selected, `${hours.value}:${minutes.value}`);
      if (!value) {
        updateActions();
        return false;
      }
      commit(value);
      close();
      return true;
    }

    function choose(value) {
      refreshBounds();
      if (!value || value < minimumDate) {
        render();
        focusDay();
        return;
      }
      if (!withTime) {
        commit(value);
        close();
        return;
      }
      selected = value;
      active = parseDate(value);
      if (updateDateTime()) return;
      render();
      focusDay();
    }

    trigger.addEventListener('click', () => {
      if (popup.isOpen()) close();
      else open();
    });
    function openFromKeyboard(event) {
      if (!event.altKey || event.key !== 'ArrowDown') return;
      event.preventDefault();
      if (!popup.isOpen()) {
        trigger.focus({ preventScroll: true });
        open();
      }
    }
    input.addEventListener('keydown', openFromKeyboard);
    timeInput?.addEventListener('keydown', openFromKeyboard);
    input.addEventListener('blur', () => {
      const value = parseDate(input.value);
      if (value) input.value = displayDate(isoDate(value));
    });
    timeInput?.addEventListener('blur', () => {
      const time = parseTime(timeInput.value);
      if (time) timeInput.value = time;
    });
    if (withTime) input.addEventListener('paste', event => {
      const parts = /^(\S+?)(?:\s*[T·.]\s*|\s+)(\d{1,2}:\d{2})$/.exec(event.clipboardData.getData('text').trim());
      const value = parts && parseDateTime(parts[1], parts[2]);
      if (!value) return;
      event.preventDefault();
      fillEnhancedDate(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    group.addEventListener('keydown', event => {
      if (event.key === 'Escape' && popup.isOpen()) {
        event.preventDefault();
        close();
      }
    });
    group.addEventListener('focusout', event => {
      if (event.relatedTarget && !group.contains(event.relatedTarget)) popup.close();
    });
    if (grid) heading.addEventListener('click', () => {
      showMonths(jump.hidden);
      if (!jump.hidden) yearField.focus();
    });
    yearField.addEventListener('change', setYear);
    yearField.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      setYear();
      months[active.getUTCMonth()].focus();
    });
    navigation.forEach(button => button.addEventListener('click', () => {
      const step = Number(button.dataset.step);
      active = addMonths(active, jump.hidden ? step : step * 12);
      render();
      if (button.disabled) (onlyMonth ? yearField : heading).focus({ preventScroll: true });
    }));
    gridBody?.addEventListener('click', event => {
      const day = event.target.closest('button[data-date]');
      if (day && !day.disabled) choose(day.dataset.date);
    });
    gridBody?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        choose(event.target.dataset.date);
        return;
      }
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      let next;
      if (offset) next = addDays(active, offset);
      else if (event.key === 'Home') next = addDays(active, -dayOfWeek(active));
      else if (event.key === 'End') next = addDays(active, 6 - dayOfWeek(active));
      else if (event.key === 'PageUp' || event.key === 'PageDown') {
        const step = event.key === 'PageUp' ? -1 : 1;
        next = addMonths(active, event.shiftKey ? step * 12 : step);
      }
      if (!next) return;
      event.preventDefault();
      if (!inRange(next)) return;
      active = next;
      render();
      focusDay();
    });
    clear?.addEventListener('click', () => {
      commit('');
      close();
    });
    todayButton.addEventListener('click', () => choose(isoDate(today)));
    input.form?.addEventListener('reset', popup.close);
    input.closest('dialog')?.addEventListener('close', popup.close);
    if (onlyMonth) {
      syncMonthLabel();
      return { sync: syncMonthLabel };
    }
  }

  form?.querySelectorAll('input[data-proposal-picker]:is([type="date"], [type="datetime-local"])')
    .forEach(input => {
      enhanceDate(input);
      if (form.matches('#proposal-form, #create-topic-form')) input.addEventListener('input', formatDateInput);
    });
  app.ui.proposalDatePicker = {
    enhanceDate,
    read(input) {
      const timeInput = dateTimeFields.get(input);
      if (timeInput) return parseDateTime(input.value, timeInput.value);
      const date = parseDate(input.value);
      return date ? isoDate(date) : input.value;
    },
    fill(input, value) {
      if (enhanced.has(input)) fillEnhancedDate(input, value);
      else input.value = value;
    },
  };
})();
