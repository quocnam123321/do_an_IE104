(() => {
  const ui = globalThis.IE104.ui;
  const encoder = new TextEncoder();
  const maxSize = 0xffffffff;
  const flags = 0x800; // UTF-8 filenames; contents are stored without compression.
  const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
    return value;
  });

  async function crc32(file) {
    let crc = 0xffffffff;
    const reader = file.stream().getReader();
    try {
      while (true) {
        const { value: bytes, done } = await reader.read();
        if (done) break;
        for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
      }
    } finally {
      reader.releaseLock();
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function uniqueName(fileName, used) {
    const safe = fileName.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').replace(/[. ]+$/g, '') || 'tep';
    const dot = safe.lastIndexOf('.');
    const stem = dot > 0 ? safe.slice(0, dot) : safe;
    const extension = dot > 0 ? safe.slice(dot) : '';
    let name = safe;
    for (let duplicate = 2; used.has(name.toLowerCase()); duplicate++) {
      name = stem + ' (' + duplicate + ')' + extension;
    }
    used.add(name.toLowerCase());
    return name;
  }

  function submissionZipNames(files) {
    const used = new Set();
    return files.map(file => uniqueName(file.name, used));
  }

  async function createSubmissionZip(files) {
    const names = submissionZipNames(files);
    const entries = files.map((file, index) => ({ file, name: encoder.encode(names[index]) }));
    const size = entries.reduce((sum, { file, name }) => sum + file.size + 76 + 2 * name.length, 22);
    if (entries.length >= 0xffff || size >= maxSize || entries.some(({ name }) => name.length > 0xffff)) {
      throw new Error('Bộ tệp quá lớn để tải chung thành ZIP. Hãy tải từng tệp trong chi tiết yêu cầu.');
    }

    const filesAndHeaders = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;
    for (const { file, name } of entries) {
      const crc = await crc32(file);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, flags, true);
      local.setUint16(12, 33, true); // DOS date 1980-01-01.
      local.setUint32(14, crc, true);
      local.setUint32(18, file.size, true);
      local.setUint32(22, file.size, true);
      local.setUint16(26, name.length, true);
      filesAndHeaders.push(local, name, file);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(8, flags, true);
      entry.setUint16(14, 33, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, file.size, true);
      entry.setUint32(24, file.size, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, offset, true);
      directory.push(entry, name);
      offset += 30 + name.length + file.size;
      directorySize += 46 + name.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...filesAndHeaders, ...directory, end], { type: 'application/zip' });
  }

  ui.createSubmissionZip = createSubmissionZip;
  ui.submissionZipNames = submissionZipNames;
})();
