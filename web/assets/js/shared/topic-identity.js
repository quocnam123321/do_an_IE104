(() => {
  const app = globalThis.IE104 ||= {};
  const titleKey = title => String(title ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

  function uniqueTitles(topics, getTitle = topic => topic.title) {
    const seen = new Set();
    return topics.filter(topic => {
      const key = titleKey(getTitle(topic));
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  app.topicIdentity = { titleKey, uniqueTitles };
})();
