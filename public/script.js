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
let monTam = [];

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
  fetch('/timkiem?ten=' + encodeURIComponent(keyword))
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('ds');
      tbody.innerHTML = '';

     let count = 0;
for (const doc of data) {
  const { ten, ngay, hanghoa, _id } = doc;
  for (let i = 0; i < hanghoa.length; i++) {
    if (count >= 10) break;
    const hh = hanghoa[i];
    const tr = document.createElement('tr');
    const thanhTien = hh.soluong * hh.dongia;

    tr.innerHTML = `
      <td><input type="checkbox" data-id="${_id}" data-index="${i}"></td>
      <td>${ten}</td>
      <td>${ngay}</td>
      <td>${hh.noidung}</td>
      <td>${hh.soluong}</td>
      <td>${hh.dongia}</td>
      <td>${thanhTien}</td>
    `;
    if (hh.thanhtoan) tr.classList.add('row-paid');

    const checkbox = tr.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', capNhatTongCong);

    tbody.appendChild(tr);
    count++;
  }
  if (count >= 10) break;
}
      capNhatTongCong();
    });
}

function chonTatCa(checkbox) {
 document.querySelectorAll('#ds input[type="checkbox"]').forEach(chk => {
  chk.checked = checkbox.checked;
  chk.dispatchEvent(new Event('change'));
});
}

function themMon() {
  const noidung = document.getElementById('nd')?.value.trim();
  const soluong = parseFloat(document.getElementById('sl')?.value) || 0;
  const dongia = parseFloat(document.getElementById('dg')?.value) || 0;

  if (!noidung || soluong <= 0 || dongia <= 0) {
    Swal.fire('❌ Thiếu hoặc sai thông tin', '', 'warning');
    return;
  }

  monTam.push({ noidung, soluong, dongia });
  renderTam();

  document.getElementById('nd').value = '';
  document.getElementById('sl').value = '';
  document.getElementById('dg').value = '';
}

function renderTam() {
  const box = document.getElementById('monTamBox');
  const tb = document.getElementById('bangTam');
  tb.innerHTML = '';

  if (monTam.length === 0) return box.style.display = 'none';
  box.style.display = '';

  monTam.forEach((m, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.noidung}</td>
      <td>${m.soluong}</td>
      <td>${m.dongia}</td>
      <td>${(m.soluong * m.dongia).toLocaleString()}</td>
      <td><button onclick="xoaMon(${i})">❌</button></td>
    `;
    tb.appendChild(tr);
  });
}

function xoaMon(i) {
  monTam.splice(i, 1);
  renderTam();
}

function luuTatCa() {
  const ten = document.getElementById('ten')?.value.trim();
  const ngay = document.getElementById('ngay')?.value.trim();

  if (!ten || !ngay || monTam.length === 0) {
    Swal.fire('⚠️ Thiếu thông tin hoặc chưa có món nào', '', 'warning');
    return;
  }

  fetch('/them', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ten, ngay, hanghoa: monTam })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      Swal.fire('✅ Đã lưu công nợ', '', 'success');
      monTam = [];
      renderTam();
      loadData();
    } else {
      Swal.fire('❌ Lỗi khi lưu', '', 'error');
    }
  });
}

function xoaDaChon() {
  const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (chks.length === 0) return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');

  Swal.fire({
    title: 'Xoá các dòng đã chọn?', icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Xoá', cancelButtonText: 'Huỷ'
  }).then(result => {
    if (!result.isConfirmed) return;
    const reqs = Array.from(chks).map(chk => {
      return fetch('/xoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
      });
    });
    Promise.all(reqs).then(() => loadData());
  });
}

function thanhToan() {
  const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (chks.length === 0)
    return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');

  // Kiểm tra nếu có dòng nào đã thanh toán
  const daThanhToan = Array.from(chks).some(chk => {
    const row = chk.closest('tr');
    return row.classList.contains('row-paid');
  });

  if (daThanhToan) {
    Swal.fire('❌ Khách này đã được thanh toán trước đó!', 'Vui lòng bỏ chọn các dòng đã thanh toán.', 'error');
    return;
  }

  Swal.fire({
    title: 'Xác nhận thanh toán cho khách?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Huỷ'
  }).then(result => {
    if (!result.isConfirmed) return;

    const reqs = Array.from(chks).map(chk => {
      return fetch('/thanhtoan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
      });
    });

    Promise.all(reqs).then(() => loadData());
  });
}
function inDanhSach() {
  const rows = [];
  let stt = 1;
  let tong = 0;

  document.querySelectorAll('#ds tr').forEach(tr => {
    const chk = tr.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const cells = tr.querySelectorAll('td');
      const noidung = cells[3].innerText;
      const sl = cells[4].innerText;
      const dongia = cells[5].innerText;
      const thanhtien = parseFloat(cells[6].innerText.replace(/,/g, ''));
      tong += thanhtien;
      rows.push(`
        <tr>
          <td>${stt++}</td>
          <td>${noidung}</td>
          <td>${sl}</td>
          <td>${Number(dongia).toLocaleString()}</td>
          <td>${thanhtien.toLocaleString()}</td>
        </tr>
      `);
    }
  });

  if (!rows.length) {
    Swal.fire('⚠️ Vui lòng chọn ít nhất 1 dòng để in hóa đơn', '', 'warning');
    return;
  }

  function numberToVietnamese(num) {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const Tien = ["", "nghìn", "triệu", "tỷ"];
    if (num == 0) return "Không đồng";

    let result = "";
    let lan = 0;

    while (num > 0) {
      let so = num % 1000;
      num = Math.floor(num / 1000);

      if (so > 0) {
        let tram = Math.floor(so / 100);
        let chuc = Math.floor((so % 100) / 10);
        let donvi = so % 10;

        let str = "";
        if (tram > 0) {
          str += ChuSo[tram] + " trăm ";
        } else if (lan > 0 && (chuc > 0 || donvi > 0)) {
          str += "không trăm ";
        }

        if (chuc > 1) {
          str += ChuSo[chuc] + " mươi ";
          if (donvi == 1) str += "mốt ";
          else if (donvi == 5) str += "lăm ";
          else if (donvi > 0) str += ChuSo[donvi] + " ";
        } else if (chuc == 1) {
          str += "mười ";
          if (donvi == 5) str += "lăm ";
          else if (donvi > 0) str += ChuSo[donvi] + " ";
        } else if (donvi > 0) {
          str += "linh " + ChuSo[donvi] + " ";
        }

        result = str.trim() + " " + Tien[lan] + " " + result.trim();
      }

      lan++;
    }

    return result.trim().replace(/\s+/g, ' ') + " đồng chẵn";
  }

  const ngayIn = new Date().toLocaleDateString('vi-VN');
  const chu = numberToVietnamese(tong);
  const logoURL = 'https://raw.githubusercontent.com/hiepdalat/minhchau/main/public/logomc.png';

  // Tự động điều chỉnh size watermark
  const watermarkSize = rows.length <= 5 ? 180 :
                        rows.length <= 10 ? 250 :
                        rows.length <= 20 ? 300 : 360;

  const html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn bán hàng</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; position: relative; }
        .header { display: flex; align-items: center; }
        .header img { height: 300px; margin-right: 16px; }
        .company-info h1 { margin: 0; color: #d00; font-size: 22px; }
        .company-info { line-height: 1.3; }
        h2 { text-align: center; margin: 20px 0 8px; color: #d00; }
        .info div { margin: 6px 0; }
        .dots-line {
          border-bottom: 1px dotted #000;
          display: inline-block;
          width: 85%;
          margin-left: 10px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 14px; }
        tfoot td { font-weight: bold; }
        .amount-text { margin-top: 16px; font-style: italic; }
        .sign { display: flex; justify-content: space-between; margin-top: 40px; }
        .sign div { text-align: center; }
        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          opacity: 0.3;
          z-index: 0;
          pointer-events: none;
        }
        .watermark img {
          width: ${watermarkSize}px;
        }
        .table-container {
  position: relative;
}

.watermark-inside {
  position: absolute;
  top: 50%;       /* Giữa chiều cao bảng */
  left: 50%;      /* Giữa chiều ngang bảng */
  transform: translate(-50%, -50%) rotate(-20deg);
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
}

.watermark-inside img {
  width: ${watermarkSize}px;
}
        
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoURL}" alt="Logo">
        <div class="company-info">
          <h1>Điện Nước Minh Châu</h1>
          <div>MST: 8056681027-001</div>
          <div>Chợ Xuân Thọ – P. Xuân Trường – TP Đà Lạt</div>
          <div>ĐT: 0973778279 – Zalo: 0938039084</div>
          <div>STK: 9973778279 – Vietcombank – Dương Xuân Hiệp</div>
        </div>
      </div>

      <h2>HÓA ĐƠN BÁN HÀNG</h2>
      <div><strong>Ngày:</strong> ${ngayIn}</div>

      <div class="info">
        <div><strong>Người mua hàng:</strong><span class="dots-line"></span></div>
        <div><strong>Địa chỉ:</strong><span class="dots-line"></span></div>
      </div>
      <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên hàng hóa, dịch vụ</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">Tổng cộng</td>
            <td>${tong.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div class="watermark-inside">
    <img src="${logoURL}" alt="Watermark">
  </div>
</div>
      <div class="amount-text">Số tiền viết bằng chữ: ${chu}</div>

      <div class="sign">
        <div>
          NGƯỜI MUA HÀNG<br>(Ký, ghi rõ họ tên)
        </div>
        <div>
          NGƯỜI BÁN HÀNG<br>Ngày ${ngayIn}<br>(Ký, ghi rõ họ tên)
        </div>
      </div>

      

      <script>window.print();</script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
function capNhatTongCong() {
  const checkboxes = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  let tong = 0;

  checkboxes.forEach(chk => {
    const tr = chk.closest('tr');
    const cells = tr.querySelectorAll('td');
    const thanhTien = parseFloat(cells[6]?.innerText?.replace(/,/g, '') || '0');
    tong += thanhTien;
  });

  const tongRow = document.getElementById('tongCongRow');
  const tongVal = document.getElementById('tongCongValue');
  tongVal.textContent = tong.toLocaleString();
  tongRow.style.display = checkboxes.length > 0 ? '' : 'none';
}

function dangXuat() {
  fetch('/logout').then(() => location.href = '/index.html');
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
