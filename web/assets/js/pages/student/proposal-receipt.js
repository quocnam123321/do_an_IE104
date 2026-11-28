(() => {
  // Giữ liên kết đã lưu từ hai trang chi tiết cũ.
  const query = location.search || (location.pathname.endsWith('/chi-tiet-de-xuat-da-luu.html') ? '?proposal=' : '');
  location.replace(`chi-tiet-de-tai-cho-duyet-sinh-vien.html${query}${location.hash}`);
})();
