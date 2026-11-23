(() => {
  const form = document.querySelector('#proposal-form, #create-topic-form');
  const app = globalThis.IE104;
  const pickers = app?.ui?.proposalPickers;
  if (!form || !pickers) return;

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
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const enhanced = new Set();
  const dateTimeFields = new Map();

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
      activate(Math.max(0, selected));
    }

    list.addEventListener('click', event => {
      const index = options.indexOf(event.target.closest('[role="option"]'));
      if (index < 0) return;
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
      else if (key === 'Home') activate(0);
      else if (key === 'ArrowUp') activate(Math.max(0, active - 1));
      else activate(Math.min(count - 1, active + 1));
    });
    return {
      get value() { return options[selected]?.textContent || ''; },
      set value(value) { select(value ? Number(value) : -1); },
    };
  }

  function enhanceDate(input) {
    const group = document.createElement('div');
    group.className = 'proposal-date-control';
    input.before(group);
    group.append(input);
    const initial = input.value;
    const withTime = input.type === 'datetime-local';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.placeholder = 'dd/mm/yyyy';
    input.maxLength = 10;
    input.autocomplete = 'off';
    enhanced.add(input);
    if (withTime) {
      group.classList.add('proposal-date-control--with-time');
      group.insertAdjacentHTML('beforeend', `
        <span class="proposal-date-separator" aria-hidden="true">·</span>
        <input class="proposal-date-time" type="text" placeholder="hh:mm" maxlength="5" autocomplete="off"
          aria-label="Giờ hết hạn đăng ký">
      `);
    }
    const timeInput = group.querySelector('.proposal-date-time');
    if (timeInput) {
      timeInput.required = input.required;
      dateTimeFields.set(input, timeInput);
    }
    fillEnhancedDate(input, initial);
    input.defaultValue = input.value;
    if (timeInput) timeInput.defaultValue = timeInput.value;

    const label = input.labels[0];
    label.id ||= `${input.id}-label`;
    const panelId = `${input.id}-calendar`;
    const headingId = `${panelId}-heading`;
    group.insertAdjacentHTML('beforeend', `
      <button type="button" class="proposal-date-trigger" aria-haspopup="dialog"
        aria-label="Mở lịch: ${label.firstChild.textContent.trim()}">
        ${icon('M20 7v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2ZM8 3v4m8-4v4M4 10h16')}
      </button>
      <div id="${panelId}" class="proposal-picker-popup proposal-calendar${withTime ? ' proposal-calendar--with-time' : ''}" role="dialog"
        aria-labelledby="${label.id}">
        <div class="proposal-calendar__header">
          <button type="button" id="${headingId}" class="proposal-calendar__heading"
            aria-expanded="false" aria-controls="${panelId}-months">
            <span aria-live="polite"></span>${icon('m7 10 5 5 5-5')}
          </button>
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
          <table class="proposal-calendar__grid" role="grid" aria-labelledby="${headingId}">
            <thead><tr>${weekdays.map(day => `<th scope="col">${day}</th>`).join('')}</tr></thead>
            <tbody></tbody>
          </table>
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
          <button type="button" data-clear-date>Xóa</button>
          <button type="button" data-today>Hôm nay</button>
        </div>
      </div>
    `);
    const trigger = group.querySelector('.proposal-date-trigger');
    const panel = group.querySelector('.proposal-calendar');
    const body = panel.querySelector('.proposal-calendar__body');
    const popup = pickers.setupPopup(group, trigger, panel, { scrollArea: body });
    const heading = panel.querySelector('.proposal-calendar__heading');
    const title = heading.querySelector('span');
    const navigation = [...panel.querySelectorAll('[data-step]')];
    const jump = panel.querySelector('.proposal-calendar__months');
    const yearField = jump.querySelector('input');
    const monthGrid = jump.querySelector('.proposal-calendar__month-grid');
    const grid = panel.querySelector('table');
    const gridBody = grid.tBodies[0];
    const clear = panel.querySelector('[data-clear-date]');
    const hours = withTime && createTimeColumn(panel.querySelector(`#${panelId}-hours`), 24, updateDateTime);
    const minutes = withTime && createTimeColumn(panel.querySelector(`#${panelId}-minutes`), 60, updateDateTime);
    let today;
    let selected;
    let active;

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = document.createElement('button');
      month.type = 'button';
      month.textContent = `Tháng ${index + 1}`;
      month.addEventListener('click', () => {
        setYear();
        active = dateAt(active.getUTCFullYear(), index, 1);
        showMonths(false);
        focusDay();
      });
      return month;
    });
    monthGrid.append(...months);

    function render() {
      const year = active.getUTCFullYear();
      const month = active.getUTCMonth();
      title.textContent = `Tháng ${month + 1} năm ${year}`;
      navigation[0].disabled = year === 1 && (!jump.hidden || month === 0);
      navigation[1].disabled = year === 9999 && (!jump.hidden || month === 11);
      updateActions();
      if (!jump.hidden) {
        yearField.value = year;
        months.forEach((button, index) => button.setAttribute('aria-pressed', String(index === month)));
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
      grid.hidden = show;
      heading.setAttribute('aria-expanded', String(show));
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
      const now = new Date();
      today = dateAt(now.getFullYear(), now.getMonth(), now.getDate());
      const date = parseDate(input.value);
      selected = date ? isoDate(date) : '';
      active = date || today;
      showMonths(false);
      popup.open();
      if (withTime) {
        const [hour = '', minute = ''] = parseTime(timeInput.value).split(':');
        hours.value = hour;
        minutes.value = minute;
        updateActions();
      }
      focusDay();
    }

    function commit(value) {
      fillEnhancedDate(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateActions() {
      clear.disabled = !(input.value || timeInput?.value || (withTime && (selected || hours.value || minutes.value)));
    }

    function updateDateTime() {
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
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });
    group.addEventListener('focusout', event => {
      if (event.relatedTarget && !group.contains(event.relatedTarget)) popup.close();
    });
    heading.addEventListener('click', () => {
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
      if (button.disabled) heading.focus({ preventScroll: true });
    }));
    gridBody.addEventListener('click', event => {
      const day = event.target.closest('button[data-date]');
      if (day) choose(day.dataset.date);
    });
    gridBody.addEventListener('keydown', event => {
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
    clear.addEventListener('click', () => {
      commit('');
      close();
    });
    panel.querySelector('[data-today]').addEventListener('click', () => choose(isoDate(today)));
    form.addEventListener('reset', popup.close);
  }

  form.querySelectorAll('input[data-proposal-picker]:is([type="date"], [type="datetime-local"])').forEach(enhanceDate);
  app.ui.proposalDatePicker = {
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
