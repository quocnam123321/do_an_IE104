(() => {
  const app = globalThis.IE104;
  const databaseName = 'ie104.demo.task-comments';
  const storeName = 'comments';
  const maxLength = 2000;
  const storageError = 'Không truy cập được bình luận đã lưu. Hãy kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.';

  function authorFor({ projectId, taskId, role }) {
    if (location.protocol === 'file:') throw new Error('Mở website qua localhost để xem và gửi bình luận.');
    const { tasks, team } = app.services.projectProgress.getState(projectId);
    if (!tasks.some(task => task.id === taskId)) throw new Error('Công việc không còn tồn tại.');

    if (role === 'student') {
      const member = team.members.find(item => item.code === app.data.currentStudent?.code);
      if (member) return { role, id: member.code, name: member.name };
    }
    if (role === 'lecturer') {
      const lecturer = app.data.currentLecturer;
      const canSupervise = app.services.approvedProjects?.canSupervise(team.project, team.supervisorIds)
        ?? team.supervisorIds.includes(lecturer?.id);
      if (lecturer && canSupervise) return { role, id: lecturer.id, name: lecturer.name };
    }
    throw new Error('Chỉ thành viên của nhóm và giảng viên hướng dẫn mới có thể tham gia bình luận.');
  }

  function openDatabase() {
    if (!globalThis.indexedDB) return Promise.reject(new Error(storageError));
    return new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDB.open(databaseName, 1);
      } catch {
        reject(new Error(storageError));
        return;
      }
      let blocked = false;
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(storeName, { keyPath: ['projectId', 'taskId', 'id'] });
        store.createIndex('task', ['projectId', 'taskId']);
      };
      request.onblocked = () => {
        blocked = true;
        reject(new Error(storageError));
      };
      request.onerror = () => reject(new Error(storageError));
      request.onsuccess = () => {
        const database = request.result;
        if (blocked) {
          database.close();
          return;
        }
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  async function transact(mode, run) {
    let database;
    try {
      database = await openDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        let result;
        let failure;
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(failure || new Error(storageError));
        const abortWith = message => {
          failure = new Error(message);
          transaction.abort();
        };
        run(transaction.objectStore(storeName), value => { result = value; }, abortWith);
      });
    } finally {
      database?.close();
    }
  }

  async function read(context) {
    if (app.services.projectProgress.usesDatabase(context.projectId)) {
      return app.proposalDatabase.readTaskComments(context.projectId, context.taskId);
    }
    const author = authorFor(context);
    const comments = await transact('readonly', (store, complete) => {
      const request = store.index('task').getAll([context.projectId, context.taskId]);
      request.onsuccess = () => complete(request.result);
    });
    return { author, comments };
  }

  async function add(context, content, parentId = null) {
    const text = String(content ?? '').trim();
    if (!text || text.length > maxLength) throw new Error('Nhập bình luận từ 1 đến 2000 ký tự.');
    const { projectId, taskId } = context;
    if (app.services.projectProgress.usesDatabase(projectId)) {
      return app.proposalDatabase.addTaskComment(projectId, taskId, text, parentId);
    }
    const comment = {
      projectId, taskId, parentId,
      id: globalThis.crypto?.randomUUID?.() || `BL-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content: text, createdAt: new Date().toISOString(),
    };
    return transact('readwrite', (store, complete, abortWith) => {
      function insert() {
        try {
          comment.author = authorFor(context);
        } catch (error) {
          abortWith(error.message);
          return;
        }
        store.add(comment);
        complete(comment);
      }
      if (parentId === null) {
        insert();
        return;
      }
      if (typeof parentId !== 'string' || !parentId) {
        abortWith('Chọn bình luận cần phản hồi.');
        return;
      }
      const request = store.get([projectId, taskId, parentId]);
      request.onsuccess = () => {
        if (!request.result || request.result.parentId !== null) {
          abortWith('Chọn một bình luận gốc để phản hồi.');
          return;
        }
        insert();
      };
    });
  }

  app.services.taskComments = { databaseName, maxLength, read, add };
})();
