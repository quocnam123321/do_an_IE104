(() => {
  const { openDatabase, storeName, readStoreName } = globalThis.IE104AcademicNotices;
  const eventName = "ie104.system-notices.changed";

  async function readInbox(account) {
    if (account.database) {
      const { websiteData } = await import("../services/website-data-api.js");
      return (await websiteData("notices/inbox", { role: account.type })).notices;
    }
    const database = await openDatabase();
    const recipient = account.type + ":" + account.id;
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName, readStoreName], "readonly");
        const messages = transaction.objectStore(storeName).index("kind").getAll("system");
        const receipts = transaction.objectStore(readStoreName).index("recipient").getAllKeys(recipient);
        transaction.onabort = () => reject(transaction.error);
        transaction.oncomplete = () => {
          const readIds = new Set(receipts.result.map(([, id]) => id));
          const notices = messages.result.flatMap((message) => {
            if (message.deleted || !message.body ||
                (message.audience !== "both" && message.audience !== account.type) ||
                !message.recipients?.some(({ id, type }) => id === account.id && type === account.type)) return [];
            const date = message.sentAt ?? message.date + "+07:00";
            if (!Number.isFinite(Date.parse(date))) return [];
            return [{
              id: message.id, title: message.name, body: message.body, date,
              read: readIds.has(message.id), system: true,
            }];
          });
          notices.sort((a, b) => Date.parse(b.date) - Date.parse(a.date) ||
            b.id.localeCompare(a.id, undefined, { numeric: true }));
          resolve(notices);
        };
      });
    } finally {
      database.close();
    }
  }

  async function markRead(account, ids) {
    if (account.database) {
      const { websiteData } = await import("../services/website-data-api.js");
      for (let index = 0; index < ids.length; index += 1000) {
        await websiteData("notices/inbox", { method: "PATCH", role: account.type, body: { ids: ids.slice(index, index + 1000) } });
      }
      notifyChange();
      return;
    }
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(readStoreName, "readwrite");
        const reads = transaction.objectStore(readStoreName);
        const recipient = account.type + ":" + account.id;
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error);
        for (const id of ids) reads.put({ recipient, id });
      });
      notifyChange();
    } finally {
      database.close();
    }
  }

  function notifyChange() {
    try {
      if (typeof BroadcastChannel === "function") {
        const channel = new BroadcastChannel(eventName);
        channel.postMessage(null);
        channel.close();
        return;
      }
    } catch {
      // Fall back to a storage event. No notification content is kept there.
    }
    try {
      localStorage.setItem(eventName, Date.now() + "-" + Math.random());
    } catch {
      // The next inbox refresh will read the committed data.
    }
  }

  function onChange(refresh) {
    try {
      if (typeof BroadcastChannel === "function") {
        const channel = new BroadcastChannel(eventName);
        channel.onmessage = refresh;
      }
    } catch {
      // Inboxes also refresh on open and respond to the storage fallback.
    }
    window.addEventListener("storage", (event) => {
      if (event.key === eventName) refresh();
    });
  }

  globalThis.IE104SystemNotices = { readInbox, markRead, notifyChange, onChange };
})();
