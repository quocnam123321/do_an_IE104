(() => {
  const app = globalThis.IE104 ||= {};
  app.ui ||= {};

  const encoder = new TextEncoder();
  const utcTimestamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escapeText = value => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, '\\$&');

  function foldLine(line) {
    let result = '';
    let bytes = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes + size > 75) {
        result += '\r\n ';
        bytes = 1;
      }
      result += character;
      bytes += size;
    }
    return result;
  }

  app.ui.createCalendarFile = (rows, month) => {
    const now = utcTimestamp(new Date());
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IE104//Deadline Calendar//VI'];
    for (const { event, projectName } of rows) {
      lines.push('BEGIN:VEVENT', `UID:${encodeURIComponent(event.id)}@ie104-nhom7.web.app`, `DTSTAMP:${now}`);
      if (event.due.length === 10) {
        lines.push(`DTSTART;VALUE=DATE:${event.due.replace(/-/g, '')}`);
      } else {
        const deadline = Date.parse(event.due);
        lines.push(`DTSTART:${utcTimestamp(new Date(deadline))}`, `DTEND:${utcTimestamp(new Date(deadline + 5 * 60_000))}`);
      }
      lines.push(`SUMMARY:${escapeText(event.name)}`);
      if (projectName) lines.push(`DESCRIPTION:${escapeText(projectName)}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return {
      blob: new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }),
      fileName: `lich-han-nop-${month}.ics`,
    };
  };
})();
