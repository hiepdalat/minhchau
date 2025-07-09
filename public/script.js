// ===================== CẤU HÌNH =====================
const SESSION_IDLE_LIMIT = 5 * 60 * 1000;
let idleTimer;
let danhSachTam = [];

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    Swal.fire({
      icon: 'info',
      title: 'Phiên làm việc đã hết',
      text: 'Bạn đã không hoạt động quá 5 phút – vui lòng đăng nhập lại.',
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
    const box = document.getElementById('dateTicker');
    if (!logout || !box) return;
    const gap = window.innerWidth - logout.getBoundingClientRect().left;
    box.style.right = gap + 'px';
  }
  function startTicker(){
    const wrap = document.getElementById('tickerWrap');
    const box = document.getElementById('dateTicker');
    if (!wrap || !box) return;
    let boxW = box.clientWidth;
    let textW = wrap.clientWidth;
    let pos = boxW;
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
    window.addEventListener('resize', () => {
      boxW = box.clientWidth;
      textW = wrap.clientWidth;
      if(pos <= -textW) pos = boxW;
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('tickerWrap');
    if (wrap) wrap.textContent = buildText();
    alignTickerBox();
    startTicker();
  });
  window.addEventListener('resize', alignTickerBox);
})();

// ===================== HỖ TRỢ ĐA TRANG =====================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'congno') initCongNo();
  if (page === 'nhaphang') initNhapHang();
  if (page === 'banhang') initBanHang();
});

// ===================== MODULE: CÔNG NỢ =====================
function initCongNo() {
  console.log('🔁 Trang công nợ');

  document.getElementById('search')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadData(e.target.value.trim());
  });

  window.addEventListener('load', () => {
    loadData();
  });

  document.getElementById('checkAll')?.addEventListener('change', function() {
    chonTatCa(this);
  });

  document.getElementById('btnLuu')?.addEventListener('click', luuTatCa);
  document.getElementById('btnXoa')?.addEventListener('click', xoaDaChon);
  document.getElementById('btnThanhToan')?.addEventListener('click', thanhToan);
  document.getElementById('btnIn')?.addEventListener('click', inDanhSach);
  document.getElementById('btnThem')?.addEventListener('click', themMon);
}
function loadData(keyword = '') {
  fetch('/api/congno?search=' + encodeURIComponent(keyword))
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('ds');
      tbody.innerHTML = '';
      data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="checkbox"></td>
          <td>${index + 1}</td>
          <td>${item.khach}</td>
          <td>${item.noidung}</td>
          <td>${item.soluong}</td>
          <td>${item.dongia}</td>
          <td>${item.soluong * item.dongia}</td>
          <td>${item.ngay}</td>
          <td>${item.thanhtoan ? '✅' : ''}</td>
        `;
        if (item.thanhtoan) tr.classList.add('row-paid');
        tbody.appendChild(tr);
      });
    });
}

function chonTatCa(checkbox) {
  const rows = document.querySelectorAll('#ds tr');
  rows.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk) chk.checked = checkbox.checked;
  });
}

function luuTatCa() {
  const rows = document.querySelectorAll('#ds tr');
  const data = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const khach = cells[2]?.innerText.trim();
    const noidung = cells[3]?.innerText.trim();
    const soluong = parseFloat(cells[4]?.innerText.trim()) || 0;
    const dongia = parseFloat(cells[5]?.innerText.trim()) || 0;
    const ngay = cells[7]?.innerText.trim();
    const thanhtoan = cells[8]?.innerText.includes('✅');
    if (khach && noidung) {
      data.push({ khach, noidung, soluong, dongia, ngay, thanhtoan });
    }
  });

  fetch('/api/congno/luu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
    .then(data => {
      Swal.fire('✅ Lưu thành công', '', 'success');
    });
}

function xoaDaChon() {
  const rows = document.querySelectorAll('#ds tr');
  const toDelete = [];
  rows.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const khach = row.cells[2]?.innerText.trim();
      const noidung = row.cells[3]?.innerText.trim();
      const ngay = row.cells[7]?.innerText.trim();
      toDelete.push({ khach, noidung, ngay });
    }
  });

  if (toDelete.length === 0) {
    Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');
    return;
  }

  Swal.fire({
    title: 'Xóa những dòng đã chọn?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  }).then(result => {
    if (result.isConfirmed) {
      fetch('/api/congno/xoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toDelete)
      }).then(res => res.json())
        .then(() => {
          loadData();
          Swal.fire('✅ Đã xóa', '', 'success');
        });
    }
  });
}

function thanhToan() {
  const rows = document.querySelectorAll('#ds tr');
  const toPay = [];
  rows.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const khach = row.cells[2]?.innerText.trim();
      const noidung = row.cells[3]?.innerText.trim();
      const ngay = row.cells[7]?.innerText.trim();
      toPay.push({ khach, noidung, ngay });
    }
  });

  if (toPay.length === 0) {
    Swal.fire('⚠️ Chưa chọn dòng nào để thanh toán', '', 'warning');
    return;
  }

  Swal.fire({
    title: 'Xác nhận đã thanh toán?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Đã thanh toán',
    cancelButtonText: 'Hủy'
  }).then(result => {
    if (result.isConfirmed) {
      fetch('/api/congno/thanhtoan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPay)
      }).then(res => res.json())
        .then(() => {
          loadData();
          Swal.fire('✅ Đã thanh toán', '', 'success');
        });
    }
  });
}

function inDanhSach() {
  const ds = document.querySelectorAll('#ds tr');
  let rows = [];
  let tongTien = 0;
  let stt = 1;

  ds.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const cells = row.querySelectorAll('td');
      const thanhTien = +(cells[6].innerText || 0);
      rows.push(`
        <tr>
          <td>${stt++}</td>
          <td>${cells[2].innerText}</td>
          <td>${cells[3].innerText}</td>
          <td>${cells[4].innerText}</td>
          <td>${cells[5].innerText}</td>
          <td>${cells[6].innerText}</td>
        </tr>
      `);
      tongTien += thanhTien;
    }
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html><head><title>Danh sách công nợ</title>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
      th { background-color: #eee; }
    </style>
    </head><body>
      <h2>Danh sách công nợ đã chọn</h2>
      <table>
        <tr><th>STT</th><th>Khách</th><th>Nội dung</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
        ${rows.join('')}
        <tr><td colspan="5"><b>Tổng cộng</b></td><td><b>${tongTien}</b></td></tr>
      </table>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function themMon() {
  const khach = document.getElementById('tenKhach')?.value.trim();
  const ngay = document.getElementById('ngayNhap')?.value.trim();
  const noidung = document.getElementById('noiDung')?.value.trim();
  const soluong = parseFloat(document.getElementById('soLuong')?.value) || 0;
  const dongia = parseFloat(document.getElementById('donGia')?.value) || 0;

  if (!khach || !ngay || !noidung || soluong <= 0 || dongia <= 0) {
    Swal.fire('❌ Thiếu hoặc sai thông tin', 'Vui lòng điền đúng các trường bắt buộc.', 'warning');
    return;
  }

  fetch('/api/congno/them', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ khach, ngay, noidung, soluong, dongia })
  }).then(res => res.json())
    .then(() => {
      loadData();
      document.getElementById('noiDung').value = '';
      document.getElementById('soLuong').value = '';
      document.getElementById('donGia').value = '';
    });
}
// ===================== MODULE: NHẬP HÀNG =====================
function initNhapHang() {
  console.log('🔁 Trang nhập hàng');

  document.getElementById('btnThemHang')?.addEventListener('click', () => {
    const maHang = document.getElementById('maHang').value.trim();
    const tenHang = document.getElementById('tenHang').value.trim();
    const soLuong = parseFloat(document.getElementById('soLuongNhap').value);
    const donGia = parseFloat(document.getElementById('donGiaNhap').value);

    if (!maHang || !tenHang || isNaN(soLuong) || isNaN(donGia)) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin hàng hóa', 'warning');
      return;
    }

    fetch('/api/kho/nhap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maHang, tenHang, soLuong, donGia })
    })
    .then(res => res.json())
    .then(data => {
      Swal.fire('Thành công', data.message || 'Đã nhập hàng thành công!', 'success');
      document.getElementById('maHang').value = '';
      document.getElementById('tenHang').value = '';
      document.getElementById('soLuongNhap').value = '';
      document.getElementById('donGiaNhap').value = '';
      taiDanhSachKho();
    });
  });

  window.addEventListener('load', () => {
    taiDanhSachKho();
  });
}

function taiDanhSachKho() {
  fetch('/api/kho')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('bangKho');
      if (!tbody) return;
      tbody.innerHTML = '';
      data.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${item.maHang}</td>
          <td>${item.tenHang}</td>
          <td>${item.soLuong}</td>
          <td>${item.donGia}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}

// ===================== MODULE: BÁN HÀNG =====================
function initBanHang() {
  console.log('🔁 Trang bán hàng');

  document.getElementById('btnThemBan')?.addEventListener('click', () => {
    const tenKhach = document.getElementById('tenKhachBan').value.trim();
    const noiDung = document.getElementById('noiDungBan').value.trim();
    const soLuong = parseFloat(document.getElementById('soLuongBan').value);
    const donGia = parseFloat(document.getElementById('donGiaBan').value);

    if (!tenKhach || !noiDung || isNaN(soLuong) || isNaN(donGia)) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường', 'warning');
      return;
    }

    const thanhTien = soLuong * donGia;
    const ngay = new Date().toISOString().slice(0, 10);

    fetch('/api/congno/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenKhach, ngay, noiDung, soLuong, donGia, thanhTien })
    })
    .then(res => res.json())
    .then(data => {
      Swal.fire('Thành công', data.message || 'Đã lưu đơn hàng bán', 'success');
      document.getElementById('noiDungBan').value = '';
      document.getElementById('soLuongBan').value = '';
      document.getElementById('donGiaBan').value = '';
      taiLichSuBan();
    });
  });

  window.addEventListener('load', () => {
    taiLichSuBan();
  });
}

function taiLichSuBan() {
  fetch('/api/congno')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('lichSuBan');
      if (!tbody) return;
      tbody.innerHTML = '';
      data.filter(d => !d.thanhtoan).slice(-10).reverse().forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${item.tenKhach}</td>
          <td>${item.noiDung}</td>
          <td>${item.soLuong}</td>
          <td>${item.donGia}</td>
          <td>${item.thanhTien}</td>
          <td>${item.ngay?.slice(0,10) || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}
