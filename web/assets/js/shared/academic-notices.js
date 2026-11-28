(() => {
  const databaseName = "ie104.admin.notifications-demo";
  const storeName = "notifications";
  const readStoreName = "systemNotificationReads";
  const eventName = "ie104.academic-notices";
  const categories = { plan: "ke-hoach-hoc-vu", submissions: "bao-cao-nop-bai", defense: "lich-bao-ve" };
  const vietnamTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 3);
      request.onupgradeneeded = ({ oldVersion }) => {
        const records = oldVersion === 0 ? request.result.createObjectStore(storeName, { keyPath: "id" }) :
          request.transaction.objectStore(storeName);
        if (oldVersion < 2) records.createIndex("status", "status");
        if (oldVersion < 3) {
          records.createIndex("kind", "kind");
          const reads = request.result.createObjectStore(readStoreName, { keyPath: ["recipient", "id"] });
          reads.createIndex("recipient", "recipient");
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  function vietnamDateTime(timestamp) {
    const parts = Object.fromEntries(vietnamTime.formatToParts(timestamp).map(({ type, value }) => [type, value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }

  async function readPublished(id) {
    const database = await openDatabase();
    try {
      const records = await new Promise((resolve, reject) => {
        const objectStore = database.transaction(storeName).objectStore(storeName);
        const request = id ? objectStore.get(id) : objectStore.index("status").getAll("published");
        request.onsuccess = () => resolve(id ? [request.result] : request.result);
        request.onerror = () => reject(request.error);
      });
      return records.flatMap((record) => {
        if (record?.kind !== "academic" || record.status !== "published" ||
            !isPublishedId(record.id) || !Object.hasOwn(categories, record.type)) return [];

        // Earlier publications stored a local Vietnamese date and minute.
        const timestamp = Date.parse(record.publishedAt ?? `${record.date}+07:00`);
        if (!Number.isFinite(timestamp)) return [];
        const body = record.body ?? "";
        const excerpt = body.trim().replace(/\s+/g, " ");
        return [{
          id: record.id, title: record.name, category: categories[record.type],
          publishedAt: new Date(timestamp).toISOString(), ...vietnamDateTime(timestamp),
          summary: excerpt.length > 220 ? excerpt.slice(0, 220).trimEnd() + "…" : excerpt,
          ...(id ? { body, html: record.html, images: record.images, attachment: record.attachment } : {}),
        }];
      });
    } finally {
      database.close();
    }
  }

  function isPublishedId(id) {
    return typeof id === "string" && /^TB-\d{3,}$/.test(id);
  }

  function sortByPublication(articles) {
    return [...articles].sort((first, second) => {
      const dateOrder = second.date.localeCompare(first.date);
      return dateOrder || (second.publishedAt ?? "").localeCompare(first.publishedAt ?? "");
    });
  }

  function onPublicationChange(update) {
    if (typeof BroadcastChannel === "function") {
      const channel = new BroadcastChannel(eventName);
      channel.onmessage = update;
    }
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) update();
    });
  }

  function notifyPublicationChange() {
    if (typeof BroadcastChannel !== "function") return;
    try {
      const channel = new BroadcastChannel(eventName);
      channel.postMessage(null);
      channel.close();
    } catch {
      // Publication already committed; the list reads it again on navigation.
    }
  }

  globalThis.IE104AcademicNotices = {
    openDatabase, storeName, readStoreName, readPublished, isPublishedId, sortByPublication, vietnamDateTime,
    onPublicationChange, notifyPublicationChange,
  };
})();
