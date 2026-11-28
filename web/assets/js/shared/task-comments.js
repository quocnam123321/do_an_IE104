(() => {
  const app = globalThis.IE104;
  const service = app.services.taskComments;
  const replyPageSize = 5;
  const date = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh',
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, className, action) {
    const node = element('button', className, text);
    node.type = 'button';
    if (action) node.addEventListener('click', action);
    return node;
  }

  function avatar(author) {
    const words = author.name.trim().split(/\s+/);
    const initials = words.slice(-2).map(part => part[0]).join('').toUpperCase();
    const node = element('span', 'task-comments__avatar', initials);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function commentBody(comment) {
    const body = element('div', 'task-comments__body');
    const meta = element('div', 'task-comments__meta');
    meta.append(element('strong', 'task-comments__author', comment.author.name));
    if (comment.author.role === 'lecturer') {
      meta.append(element('span', 'task-comments__role', 'Giảng viên'));
    }
    const parts = Object.fromEntries(date.formatToParts(new Date(comment.createdAt)).map(part => [part.type, part.value]));
    const time = element('time', '', `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`);
    time.dateTime = comment.createdAt;
    meta.append(time);
    body.append(meta, element('p', 'task-comments__text', comment.content));
    return body;
  }

  function newestFirst(a, b) {
    return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
  }

  function openChannel() {
    try {
      return new BroadcastChannel(service.databaseName);
    } catch {
      return null;
    }
  }

  function mount(dialog, role) {
    const container = dialog.querySelector('[data-task-comments-content]');
    const channel = openChannel();
    let current = null;

    function render(session) {
      const { comments, replyLimits, editor, list, more } = session;
      const focused = list.contains(document.activeElement) ? document.activeElement : null;
      const roots = comments.filter(comment => comment.parentId === null).sort(newestFirst);
      if (editor) {
        const editingIndex = roots.findIndex(comment => comment.id === editor.parentId);
        session.limit = Math.max(session.limit, editingIndex + 1);
      }
      const replies = new Map();
      for (const comment of comments) {
        if (comment.parentId === null) continue;
        if (!replies.has(comment.parentId)) replies.set(comment.parentId, []);
        replies.get(comment.parentId).push(comment);
      }

      list.replaceChildren(...roots.slice(0, session.limit).map(comment => {
        const item = element('li', 'task-comments__item');
        item.id = 'task-comment-' + comment.id;
        item.tabIndex = -1;
        const body = commentBody(comment);
        const actions = element('div', 'task-comments__actions');
        const reply = button('Phản hồi', 'task-comments__action task-comments__reply', () => openReply(session, comment));
        reply.id = item.id + '-reply';
        const editing = editor?.parentId === comment.id;
        reply.setAttribute('aria-label', 'Phản hồi bình luận của ' + comment.author.name);
        reply.setAttribute('aria-expanded', String(editing));
        if (editing) reply.setAttribute('aria-controls', editor.form.id);
        actions.append(reply);
        body.append(actions);
        item.append(avatar(comment.author), body);

        const children = replies.get(comment.id) ?? [];
        const shown = Math.min(replyLimits.get(comment.id) ?? 0, children.length);
        if (children.length || editing) {
          const thread = element('div', 'task-comments__thread');
          thread.hidden = !editing && !shown;
          if (editing) thread.append(editor.form);
          body.append(thread);
          if (children.length) {
            children.sort((a, b) => newestFirst(b, a));
            const nested = element('ul', 'task-comments__replies');
            nested.id = item.id + '-replies';
            nested.hidden = !shown;
            nested.append(...children.slice(0, shown).map(child => {
              const row = element('li', 'task-comments__item');
              row.id = 'task-comment-' + child.id;
              row.tabIndex = -1;
              row.append(avatar(child.author), commentBody(child));
              return row;
            }));
            thread.append(nested);

            const allShown = shown === children.length;
            const label = !shown ? `${children.length} phản hồi` : allShown ? 'Ẩn phản hồi' : 'Xem thêm phản hồi';
            const toggle = button(label, 'task-comments__disclosure', () => {
              if (allShown) replyLimits.delete(comment.id);
              else replyLimits.set(comment.id, shown + replyPageSize);
              render(session);
              const focusId = allShown ? toggle.id : 'task-comment-' + children[shown].id;
              document.getElementById(focusId)?.focus();
            });
            toggle.id = item.id + '-toggle';
            toggle.setAttribute('aria-controls', nested.id);
            if (!shown || allShown) toggle.setAttribute('aria-expanded', String(allShown));
            const chevron = element('span', 'task-comments__chevron');
            chevron.setAttribute('aria-hidden', 'true');
            toggle.append(chevron);
            body.append(toggle);
          }
        }
        return item;
      }));
      list.hidden = roots.length === 0;
      more.hidden = roots.length <= session.limit;
      if (focused) {
        const next = focused.isConnected ? focused : document.getElementById(focused.id);
        next?.focus({ preventScroll: true });
      }
    }

    function openReply(session, comment) {
      if (session.pending) return;
      if (session.editor?.parentId !== comment.id) {
        if (session.editor) {
          session.drafts.set(session.editor.parentId, session.editor.input.value);
        }
        session.editor = composer(session, comment);
        session.editor.input.value = session.drafts.get(comment.id) || '';
        session.editor.sync();
        render(session);
      }
      session.editor.input.focus();
    }

    function composer(session, parent) {
      const form = element('form', 'task-comments__form');
      const editor = { form, parentId: parent?.id ?? null };
      const input = element('textarea');
      input.rows = 2;
      input.maxLength = service.maxLength;
      input.placeholder = parent ? 'Viết phản hồi' : 'Viết bình luận';
      input.setAttribute('aria-label', input.placeholder);
      const error = element('p', 'task-comments__error');
      error.id = parent ? 'task-reply-error' : 'task-comment-error';
      error.setAttribute('role', 'alert');
      error.hidden = true;
      input.setAttribute('aria-describedby', error.id);
      const actions = element('div', 'task-comments__form-actions');
      if (parent) {
        const cancel = button('Hủy', 'task-comments__action task-comments__cancel', () => {
          if (session.pending) return;
          session.drafts.delete(parent.id);
          session.editor = null;
          render(session);
          document.getElementById('task-comment-' + parent.id + '-reply')?.focus();
        });
        actions.append(cancel);
        form.id = 'task-comment-reply-form';
        form.append(element('p', 'task-comments__hint', 'Đang phản hồi ' + parent.author.name));
      }
      const send = button('Gửi', 'task-comments__send');
      send.type = 'submit';
      actions.append(send);
      form.append(input, error, actions);
      const sync = () => { send.disabled = !input.value.trim() || session.pending; };
      input.addEventListener('input', () => {
        error.hidden = true;
        sync();
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        void submit(session, editor);
      });
      Object.assign(editor, { input, error, sync });
      sync();
      return editor;
    }

    function eventMatches(session, context) {
      return session?.context.projectId === context?.projectId && session?.context.taskId === context?.taskId;
    }

    async function submit(session, editor) {
      const { input, error, parentId, form } = editor;
      const content = input.value.trim();
      if (session !== current || session.pending || !content) return;
      const wasFocused = form.contains(document.activeElement);
      session.pending = true;
      input.readOnly = true;
      error.hidden = true;
      session.main.sync();
      session.editor?.sync();
      try {
        const comment = await service.add(session.context, content, parentId);
        channel?.postMessage({ projectId: comment.projectId, taskId: comment.taskId });
        if (session !== current) {
          if (current && eventMatches(current, session.context)) void refresh(current);
          return;
        }
        // A tab refresh may already have read this just-committed comment.
        if (!session.comments.some(item => item.id === comment.id)) session.comments.push(comment);
        const restoreFocus = wasFocused && (form.contains(document.activeElement) || document.activeElement === document.body);
        input.value = '';
        if (parentId !== null) {
          session.drafts.delete(parentId);
          session.editor = null;
          const total = session.comments.filter(item => item.parentId === parentId).length;
          session.replyLimits.set(parentId, Math.max(replyPageSize, total));
        }
        render(session);
        session.status.textContent = parentId === null ? 'Đã gửi bình luận.' : 'Đã gửi phản hồi.';
        input.readOnly = false;
        if (restoreFocus) {
          if (parentId === null) input.focus();
          else document.getElementById('task-comment-' + comment.id)?.focus();
        }
        void refresh(session);
      } catch (failure) {
        if (session === current) {
          error.textContent = failure.message;
          error.hidden = false;
        }
      } finally {
        session.pending = false;
        input.readOnly = false;
        session.main.sync();
        session.editor?.sync();
      }
    }

    function build(session) {
      session.main = composer(session);
      const composerRow = element('div', 'task-comments__composer');
      composerRow.append(avatar(session.author), session.main.form);
      session.list = element('ul', 'task-comments__list');
      session.more = button('Xem thêm bình luận', 'task-comments__action task-comments__more', () => {
        const firstNewIndex = session.limit;
        session.limit += 10;
        render(session);
        session.list.children[firstNewIndex]?.focus();
      });
      session.status = element('p', 'visually-hidden');
      session.status.setAttribute('role', 'status');
      container.replaceChildren(composerRow, session.status, session.list, session.more, session.message);
    }

    async function refresh(session) {
      if (!session.context.projectId) return;
      const request = ++session.request;
      try {
        const result = await service.read(session.context);
        if (current !== session || request !== session.request) return;
        const previous = new Set(session.comments.map(comment => comment.id));
        const changed = result.comments.length !== previous.size || result.comments.some(comment => !previous.has(comment.id));
        session.comments = result.comments;
        session.message.hidden = true;
        if (!session.main) {
          session.author = result.author;
          build(session);
          render(session);
        } else if (changed) render(session);
      } catch (failure) {
        if (current !== session || request !== session.request) return;
        session.message.textContent = failure.message;
        session.message.hidden = false;
      }
    }

    channel?.addEventListener('message', event => {
      if (current && dialog.open && eventMatches(current, event.data)) void refresh(current);
    });
    document.addEventListener('visibilitychange', () => {
      if (current && dialog.open && !document.hidden) void refresh(current);
    });
    dialog.addEventListener('close', () => {
      if (!dialog.open) current = null;
    });
    return ({ projectId, taskId }) => {
      const message = element('p', 'task-comments__hint',
        projectId ? 'Đang tải bình luận…' : 'Công việc mẫu chưa có luồng bình luận chung.');
      message.setAttribute('role', 'status');
      container.replaceChildren(message);
      current = {
        context: { projectId, taskId, role }, message, request: 0,
        comments: [], replyLimits: new Map(), drafts: new Map(), limit: 3, pending: false,
      };
      void refresh(current);
    };
  }

  app.ui.mountTaskComments = mount;
})();
