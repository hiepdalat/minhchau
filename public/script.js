// script.js – Gộp xử lý đầy đủ cho 3 trang: congno.html, khohang.html (nhaphang), banhang.html

// ===================== CẤU HÌNH =====================
const SESSION_IDLE_LIMIT = 5 * 60 * 1000;
let idleTimer;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    Swal.fire({
      icon: 'info',
      title: 'Phiên làm việc đã hết',
      text: 'Bạn đã không hoạt động quá 5 phút – vui lòng đăng nhập lại.'
    }).then(() => window.location.href = '/logout');
  }, SESSION_IDLE_LIMIT);
}
['click','mousemove','keydown','scroll','touchstart'].forEach(evt =>
  document.addEventListener(evt, resetIdleTimer));
resetIdleTimer();

// ===================== TICKER NGÀY =====================
(() => {
  const thuVN = ['Chủ nhật','Hai','Ba','Tư','Năm','Sáu','Bảy'];
  function buildText(){
    const d = new Date();
    return `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()} – Chúc bạn một ngày làm việc thật hiệu quả!`;
  }
  function alignTickerBox(){
    const logout = document.querySelector('.btn-logout');
    const box    = document.getElementById('dateTicker');
    if (!logout || !box) return;
    const gap    = window.innerWidth - logout.getBoundingClientRect().left;
    box.style.right = gap + 'px';
  }
  function startTicker(){
    const wrap = document.getElementById('tickerWrap');
    const box  = document.getElementById('dateTicker');
    if (!wrap || !box) return;
    let boxW  = box.clientWidth;
    let textW = wrap.clientWidth;
    let pos   = boxW;
    const speed = 60;
    let last = performance.now();
    function loop(now){
      const dt = (now - last) / 1000;
      last = now;
      pos -= speed * dt;
      while (pos <= -textW) pos += (textW + boxW);
      wrap.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    window.addEventListener('resize', ()=>{
      boxW  = box.clientWidth;
      textW = wrap.clientWidth;
      if(pos <= -textW) pos = boxW;
    });
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const wrap = document.getElementById('tickerWrap');
    if (wrap) wrap.textContent = buildText();
    alignTickerBox();
    startTicker();
  });
  window.addEventListener('resize', alignTickerBox);
})();

// ===================== ĐĂNG XUẤT =====================
function dangXuat() {
  fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/index.html');
}

// ===================== TRANG =====================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'congno') initCongNo();
  if (page === 'nhaphang') initNhapHang();
  if (page === 'banhang') initBanHang();
});

// ===================== MODULE: CONGNO =====================
function initCongNo() {
  const form = document.getElementById('formNhap');
  const table = document.getElementById('ds');
  const tbody = table.querySelector('tbody');
  const ten = document.getElementById('ten');
  const ngay = document.getElementById('ngay');
  const noidung = document.getElementById('noidung');
  const soluong = document.getElementById('soluong');
  const dongia = document.getElementById('dongia');
  const btnThem = document.getElementById('btnThem');
  const btnTim = document.getElementById('btnTim');

  function buildRow(doc, index, i) {
    const tr = document.createElement('tr');
    const h = doc.hanghoa[i];
    const tt = h.soluong * h.dongia;
    tr.innerHTML = `
      <td><input type="checkbox"></td>
      <td>${index + 1}</td>
      <td>${doc.ten}</td>
      <td>${doc.ngay}</td>
      <td>${h.noidung}</td>
      <td>${h.soluong}</td>
      <td>${h.dongia}</td>
      <td>${tt.toLocaleString()}</td>
      <td>${h.thanhtoan ? '✅' : `<button class="btnThanhToan" data-id="${doc._id}" data-index="${i}">💰</button>`}</td>
      <td><button class="btnXoa" data-id="${doc._id}" data-index="${i}">❌</button></td>`;
    return tr;
  }

  function loadData(kw = '') {
    tbody.innerHTML = '<tr><td colspan="10">Đang tải...</td></tr>';
    fetch('/timkiem?ten=' + encodeURIComponent(kw))
      .then(r => r.json())
      .then(data => {
        if (!data.length) {
          tbody.innerHTML = '<tr><td colspan="10">Không có dữ liệu</td></tr>';
          return;
        }
        tbody.innerHTML = '';
        data.forEach((doc, idx) => {
          doc.hanghoa.forEach((_, i) => {
            tbody.appendChild(buildRow(doc, idx, i));
          });
        });
      });
  }

  btnTim.addEventListener('click', () => {
    loadData(ten.value);
  });

  btnThem.addEventListener('click', () => {
    const item = {
      noidung: noidung.value.trim(),
      soluong: +soluong.value,
      dongia: +dongia.value
    };
    if (!ten.value || !ngay.value || !item.noidung || item.soluong <= 0 || item.dongia <= 0) {
      return alert('Vui lòng điền đầy đủ thông tin');
    }
    fetch('/them', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ten: ten.value, ngay: ngay.value, hanghoa: [item] })
    }).then(() => {
      loadData(ten.value);
      noidung.value = '';
      soluong.value = 1;
      dongia.value = 0;
      noidung.focus();
    });
  });

  tbody.addEventListener('click', (e) => {
    const btnXoa = e.target.closest('.btnXoa');
    const btnThanhToan = e.target.closest('.btnThanhToan');
    if (btnXoa) {
      const { id, index } = btnXoa.dataset;
      if (confirm('Xóa dòng này?')) {
        fetch('/xoa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, index })
        }).then(() => loadData(ten.value));
      }
    }
    if (btnThanhToan) {
      const { id, index } = btnThanhToan.dataset;
      if (confirm('Đánh dấu đã thanh toán?')) {
        fetch('/thanhtoan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, index })
        }).then(() => loadData(ten.value));
      }
    }
  });

  loadData();
}
