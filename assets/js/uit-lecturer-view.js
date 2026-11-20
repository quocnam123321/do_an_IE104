(() => {
  const data = window.UITLecturerCatalog;
  if (!data) return;
  const file = location.pathname.split('/').pop();
  const kind = file.includes('dang-huong-dan') ? 'supervised' : 'created';
  if (!file.startsWith('chi-tiet-de-tai-') && !file.startsWith('chinh-sua-de-tai-')) return;
  const params = new URLSearchParams(location.search);
  if (kind === 'supervised' && params.has('project')) return;
  const id = params.get('topic') || data[kind][0];
  const record = data.records.find(item => data[kind].includes(item.id) &&
    (item.id === id || data.formatCode(item.topicType, item.code) === id));
  if (!record) {
    const main = document.querySelector('.page-container');
    const message = document.createElement('p'); message.textContent = 'Không tìm thấy đề tài trong danh sách này.';
    const back = document.createElement('a'); back.href = kind === 'supervised' ? 'danh-sach-de-tai-dang-huong-dan.html' : 'danh-sach-de-tai-da-tao.html'; back.textContent = 'Quay lại danh sách';
    main.replaceChildren(message, back); return;
  }
  const code = data.formatCode(record.topicType, record.code);
  const courseLabel = record.courseLabel || 'Không áp dụng';
  const set = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  if (file.startsWith('chinh-sua-de-tai-')) {
    const fields = {
      'ma-de-tai': code,
      'ten-de-tai': record.title,
      'mo-ta': record.description,
      'muc-tieu': record.objectives.join('\n'),
      'yeu-cau-thuc-hien': record.requirements?.join('\n') || '[Yêu cầu thực hiện]',
      'ho-ten-giang-vien': 'Nguyễn Văn A',
      'khoa-bo-mon': record.faculty,
      'email-lien-he': 'giangvien@example.com',
      'cong-nghe-goi-y': record.technology || '[Công nghệ gợi ý]',
    };
    for (const [id, value] of Object.entries(fields)) {
      const field = document.getElementById(id);
      if (field && value != null) field.value = value;
    }
    const selections = [
      ['loai-de-tai', record.topicType, record.type],
      ['mon-hoc', record.course || 'not-applicable', courseLabel],
      ['hoc-ky', record.semester, `Học kỳ ${record.semester}`],
      ['nam-hoc', record.academicYear, record.academicYear],
      ['linh-vuc', record.field, record.field],
    ];
    for (const [id, value, label] of selections) {
      const select = document.getElementById(id);
      if (!select || !value) continue;
      if (!Array.from(select.options).some(option => option.value === value)) select.add(new Option(label, value));
      select.value = value;
    }
    document.querySelectorAll('a[href="chi-tiet-de-tai-da-tao-giang-vien.html"]').forEach(link => { link.href += `?topic=${encodeURIComponent(id)}`; });
    document.title = `${record.title} | Chỉnh sửa đề tài`; return;
  }
  set('#topic-summary-title, .page-header__topic-name', record.title);
  const values = kind === 'supervised' ? [code, record.type, courseLabel, 'Học kỳ 1 · 2026–2027'] : [code, record.type, courseLabel, 'Học kỳ 1', '2026–2027'];
  document.querySelectorAll('.topic-summary__meta dd, .topic-summary__details dd').forEach((node, index) => { node.textContent = values[index] || 'Chưa có thông tin'; });
  set('.topic-description p', record.description);
  for (const key of ['objectives', 'outcomes', 'requirements']) {
    const section = document.querySelector(`.topic-${key}`);
    if (!section || !record[key]) continue;
    const list = section.querySelector('ul');
    if (list) list.replaceChildren(...record[key].map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    else { const paragraph = section.querySelector('p'); if (paragraph) paragraph.textContent = record[key].join('\n'); }
  }
  const description = document.querySelector('.topic-description');
  if (description && (record.summaryUrl || record.sourceUrl)) {
    const paragraph = document.createElement('p'); const link = document.createElement('a');
    link.href = record.summaryUrl || record.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = record.summaryUrl ? 'Xem tóm tắt tại nguồn UIT' : 'Xem hồ sơ tại nguồn UIT'; paragraph.append(link); description.append(paragraph);
  }
  const supervisor = ['Nguyễn Văn A', record.faculty, 'giangvien@example.com', 'Khoa học dữ liệu và Hệ thống thông tin'];
  document.querySelectorAll('.topic-supervisor__details dd').forEach((node, index) => { node.textContent = supervisor[index] || 'Chưa có thông tin'; });
  const work = kind === 'supervised' ? record.supervision : undefined;
  if (work) window.IE104.ui.renderSupervisedDemo(record);
  const team = document.querySelector('.topic-team__members');
  if (team) {
    const template = team.firstElementChild.cloneNode(true);
    team.replaceChildren(...record.authors.map((name, index) => {
      const member = template.cloneNode(true); member.querySelector('.team-member__name').textContent = name;
      member.querySelector('.team-member__id').textContent = record.studentIds?.[index] || record.studentId;
      const avatar = member.querySelector('.team-member__avatar'); avatar.textContent = name.split(/\s+/).slice(-2).map(part => part[0]).join(''); avatar.setAttribute('aria-label', name);
      member.querySelector('.team-member__role').textContent = index === 0 ? 'Nhóm trưởng' : 'Thành viên'; return member;
    }));
    set('.topic-team__group-name', work?.group || `Nhóm ${String(data.records.indexOf(record) + 1).padStart(2, '0')}`);
  }
  const popovers = Array.from(document.querySelectorAll('.progress-member-popover'));
  if (popovers.length) {
    if (!work) {
      const taskTitles = ['Xác định yêu cầu đầu vào', 'Phân tích dữ liệu liên quan', 'Soạn tài liệu phương pháp', 'Chuẩn bị báo cáo cuối kỳ', 'Thiết kế giải pháp', 'Chuẩn hóa dữ liệu', 'Triển khai thành phần chính', 'Kiểm thử và đánh giá', 'Tích hợp các thành phần', 'Tổng hợp kết quả', 'Khảo sát và phân tích yêu cầu', 'Lập kế hoạch thực hiện đề tài', 'Hoàn thiện tài liệu phân tích'];
      document.querySelectorAll('#progress-section .task-card__title').forEach((node, index) => { node.textContent = taskTitles[index % taskTitles.length]; });
    }
    const template = popovers[0].cloneNode(true); const parent = popovers[0].parentElement;
    popovers.forEach(node => node.remove());
    const initials = name => name.split(/\s+/).slice(-2).map(part => part[0]).join('');
    record.authors.forEach((name, index) => {
      const popover = template.cloneNode(true);const identity = `progress-member-${record.code}-${index}`;
      popover.id = identity;popover.setAttribute('aria-labelledby',identity+'-name');
      const heading = popover.querySelector('.progress-member-popover__name');heading.id=identity+'-name';heading.textContent=name;
      popover.querySelector('.progress-member-popover__avatar').textContent=initials(name);
      popover.querySelector('.progress-member-popover__id').textContent=record.studentIds?.[index] || record.studentId;
      popover.querySelector('.progress-member-popover__role').textContent=index===0?'Nhóm trưởng':'Thành viên';
      const close=popover.querySelector('.progress-member-popover__close');close.setAttribute('popovertarget',identity);close.setAttribute('aria-label','Đóng thông tin '+name);parent.append(popover);
    });
    document.querySelectorAll('.task-assignees').forEach((group, taskIndex) => {
      const title = group.closest('.task-card').querySelector('.task-card__title').textContent;
      group.setAttribute('aria-label', `Thành viên phụ trách công việc ${title}`);
      const buttons=Array.from(group.querySelectorAll('.task-assignee:not(.task-assignee--more)'));
      if (!buttons.length) return;
      const template=buttons[0].cloneNode(true);const total=Math.min(buttons.length,record.authors.length);
      group.replaceChildren(...Array.from({length:total},(_,offset)=>{
        const index=(taskIndex+offset)%record.authors.length;const name=record.authors[index];const button=template.cloneNode(true);
        button.className='task-assignee';button.setAttribute('popovertarget',`progress-member-${record.code}-${index}`);
        button.setAttribute('aria-label',`Xem thông tin ${name}, mã số sinh viên ${record.studentIds?.[index] || record.studentId}`);button.title=name;
        button.querySelector('.task-assignee__avatar').textContent=initials(name);return button;
      }));
    });
  }
  document.querySelectorAll('.topic-edit-link').forEach(link => { link.href = `chinh-sua-de-tai-giang-vien.html?topic=${encodeURIComponent(id)}`; });
  document.querySelectorAll('.confirmation-dialog strong').forEach(node => { node.textContent = record.title; });
  document.querySelectorAll('.topic-summary__image[aria-label]').forEach(node => { node.setAttribute('aria-label', `Ảnh minh họa đề tài ${record.title}`); });
  document.title = `${record.title} | Chi tiết đề tài`;
})();
