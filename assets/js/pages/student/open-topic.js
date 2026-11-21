(() => {
  const app = globalThis.IE104;
  const service = app?.services?.registrations;
  const article = document.querySelector('[data-open-topic]');
  if (!article || !service) return;

  const notice = document.querySelector('[data-open-topic-notice]');
  const form = article.querySelector('.registration-form');
  const topicId = new URLSearchParams(location.search).get('topic') ?? 'DT001';

  try {
    const preview = location.protocol === 'file:';
    const sample = app.data.openTopics.find(item => item.id === topicId);
    const topic = preview ? sample : service.getTopic(topicId);
    if (!topic) throw new Error('Không tìm thấy đề tài để đăng ký.');

    // The original DT001 page used the sample description and semester before local edits.
    const content = sample && topic.record?.revision === 0 ? sample : topic;
    const supervisor = content.supervisor || (content.lecturer === sample?.lecturer ? sample?.supervisor : null);
    const values = {
      title: content.title,
      code: content.displayId || content.code || content.id,
      type: content.typeLabel,
      course: content.courseLabel || 'Không áp dụng',
      mode: topic.registrationRules?.maxMembers === 1 ? 'Cá nhân' : 'Cá nhân hoặc theo nhóm',
      semester: content.semester === 'he' ? 'Hè' : content.semester,
      academicYear: content.academicYear?.replace(/^(\d{4})[-–](\d{4})$/, '$1 - $2'),
      lecturer: content.lecturer,
      research: supervisor?.research,
      email: supervisor?.email,
      description: content.description,
      outcomes: content.outcomes,
      objectives: toLines(content.objectives),
      requirements: toLines(content.requirements ?? content.record?.requirements),
    };

    article.querySelectorAll('[data-topic-field]').forEach(field => {
      renderValue(field, values[field.dataset.topicField]);
    });
    const degree = article.querySelector('[data-sample-degree]');
    degree.hidden = !sample || content.lecturer !== sample.lecturer || Boolean(topic.ownerId);
    if (preview) {
      notice.textContent = 'Đang xem đề tài mẫu. Mở website qua localhost để đăng ký.';
      notice.hidden = false;
    } else {
      form.dataset.topicId = topicId;
    }
    document.title = `Chi tiết đề tài ${values.code} | Quản lý đồ án`;
    article.hidden = false;
  } catch (failure) {
    notice.textContent = failure.message;
    notice.hidden = false;
  }

  function toLines(value) {
    if (Array.isArray(value)) return value;
    return (value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  function renderValue(field, value) {
    if (Array.isArray(value) && value.length) {
      const list = document.createElement('ul');
      for (const line of value) {
        const item = document.createElement('li');
        item.textContent = line;
        list.append(item);
      }
      field.replaceChildren(list);
      return;
    }

    field.textContent = value?.length === 0 || value == null ? 'Chưa có thông tin' : value;
  }
})();
