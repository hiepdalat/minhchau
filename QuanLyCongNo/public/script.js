// script.js – Gộp từ script congno + nhap + ban hàng

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
    const ngay = `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()}`;
    return ngay + ' – Chúc bạn một ngày làm việc thật hiệu quả!';
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

// ===================== HỖ TRỢ ĐA TRANG =====================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'congno') initCongNo();
  if (page === 'nhaphang') initNhapHang();
  if (page === 'banhang') initBanHang();
});

// ===================== MODULE: CONG NỢ =====================
function initCongNo() {
  // Copy toàn bộ các hàm và logic từ script gốc congno.js vào đây (rút gọn lại nếu cần)
  // Vì nội dung đã rất dài nên nên đặt riêng các phần xử lý tại đây hoặc import qua module
  console.log('🔁 Trang công nợ');
  // gọi loadData(), themMon(), luuTatCa() ... như trong file script gốc của bạn
}

// ===================== MODULE: NHẬP HÀNG =====================
function initNhapHang() {
  const supplierInput = document.getElementById('supplier');
  const dateInput = document.getElementById('date');
  const productInput = document.getElementById('product');
  const unitInput = document.getElementById('unit');
  const qtyInput = document.getElementById('qty');
  const priceInput = document.getElementById('price');
  const discountInput = document.getElementById('discount');
  const addItemBtn = document.getElementById('addItem');
  const tableBody = document.querySelector('#itemsTable tbody');
  const grandTotalCell = document.getElementById('grandTotal');
  const saveBtn = document.getElementById('saveBtn');
  const detailBtn = document.getElementById('detailBtn');
  dateInput.valueAsDate = new Date();
  let items = [];

  function renderTable() {
    tableBody.innerHTML = '';
    if (items.length === 0) {
      tableBody.innerHTML = '<tr id="noData"><td colspan="9">Chưa có mặt hàng</td></tr>';
      grandTotalCell.textContent = 0;
      return;
    }
    let total = 0;
    items.forEach((it, idx) => {
      const giaNhap = it.price * (1 - it.discount / 100);
      const thanhTien = giaNhap * it.qty;
      total += thanhTien;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx + 1}</td><td>${it.name}</td><td>${it.unit}</td><td>${it.qty}</td><td>${it.price.toLocaleString()}</td><td>${it.discount}%</td><td>${giaNhap.toLocaleString()}</td><td>${thanhTien.toLocaleString()}</td><td><button class="btn btn-danger btn-sm" data-idx="${idx}"><i class="fa fa-trash"></i></button></td>`;
      tableBody.appendChild(tr);
    });
    grandTotalCell.textContent = total.toLocaleString();
  }

  addItemBtn.addEventListener('click', () => {
    const name = productInput.value.trim();
    const unit = unitInput.value.trim();
    const qty = +qtyInput.value;
    const price = +priceInput.value;
    const discount = +discountInput.value || 0;
    if (!name || !unit || qty <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm.');
      return;
    }
    items.push({ name, unit, qty, price, discount });
    productInput.value = unitInput.value = '';
    qtyInput.value = 1;
    priceInput.value = 0;
    discountInput.value = 0;
    productInput.focus();
    renderTable();
  });

  tableBody.addEventListener('click', e => {
    const btn = e.target.closest('button[data-idx]');
    if (btn) {
      const idx = +btn.dataset.idx;
      items.splice(idx, 1);
      renderTable();
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!supplierInput.value) return alert('Vui lòng nhập tên đại lý');
    if (items.length === 0) return alert('Chưa có mặt hàng nào');
    fetch('/api/stock/receive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier: supplierInput.value, date: dateInput.value, items })
    })
      .then(r => r.json())
      .then(res => {
        alert('Đã lưu phiếu nhập #' + res.id);
        items = [];
        renderTable();
      })
      .catch(err => {
        console.error(err);
        alert('Lỗi khi lưu phiếu');
      });
  });

  detailBtn.addEventListener('click', () => {
    if (!dateInput.value) return alert('Vui lòng chọn ngày để xem chi tiết phiếu nhập');
    window.open('/chi-tiet-phieu-nhap?ngay=' + dateInput.value, '_blank');
  });
}

// ===================== MODULE: BÁN HÀNG =====================
function initBanHang() {
  const $ = id => document.getElementById(id);
  const customerInput = $('customer');
  const saleDateInput = $('saleDate');
  const productInput = $('product');
  const unitInput = $('unit');
  const qtyInput = $('qty');
  const priceInput = $('price');
  const addItemBtn = $('addItem');
  const printBtn = $('printBtn');
  const detailBtn = $('detailBtn');
  const stockInfo = $('stockInfo');
  const tableBody = document.querySelector('#itemsTable tbody');
  const grandTotalCell = $('grandTotal');
  saleDateInput.valueAsDate = new Date();

  let products = [];
  let cart = [];

  fetch('/api/products/stock')
    .then(r => r.json())
    .then(data => {
      products = data;
      const datalist = document.getElementById('productList');
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        datalist.appendChild(opt);
      });
    });

  function renderTable() {
    tableBody.innerHTML = '';
    if (cart.length === 0) {
      tableBody.innerHTML = '<tr id="noData"><td colspan="7">Chưa có mặt hàng</td></tr>';
      grandTotalCell.textContent = '0';
      return;
    }
    let total = 0;
    cart.forEach((row, idx) => {
      const sub = row.price * row.qty;
      total += sub;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx + 1}</td><td>${row.name}</td><td>${row.unit}</td><td>${row.qty}</td><td>${row.price.toLocaleString()}</td><td>${sub.toLocaleString()}</td><td><button class="btn btn-danger btn-sm" data-idx="${idx}"><i class="fa fa-trash"></i></button></td>`;
      tableBody.appendChild(tr);
    });
    grandTotalCell.textContent = total.toLocaleString();
  }

  productInput.addEventListener('input', () => {
    const p = products.find(x => x.name === productInput.value.trim());
    if (p) {
      unitInput.value = p.unit;
      priceInput.value = p.price;
      stockInfo.textContent = `(Tồn: ${p.qty_on_hand})`;
    } else stockInfo.textContent = '';
  });

  addItemBtn.addEventListener('click', () => {
    const name = productInput.value.trim();
    const prod = products.find(x => x.name === name);
    if (!prod) return alert('Sản phẩm không hợp lệ');
    const qty = +qtyInput.value;
    if (qty <= 0 || qty > prod.qty_on_hand)
      return alert(`Tồn kho không đủ (còn ${prod.qty_on_hand})`);
    prod.qty_on_hand -= qty;
    cart.push({ code: prod.code, name: prod.name, unit: prod.unit, qty, price: +priceInput.value });
    productInput.value = unitInput.value = '';
    qtyInput.value = 1;
    priceInput.value = 0;
    stockInfo.textContent = '';
    renderTable();
  });

  tableBody.addEventListener('click', e => {
    const btn = e.target.closest('button[data-idx]');
    if (!btn) return;
    const idx = +btn.dataset.idx;
    const removed = cart.splice(idx, 1)[0];
    const p = products.find(x => x.name === removed.name);
    if (p) p.qty_on_hand += removed.qty;
    renderTable();
  });

  printBtn.addEventListener('click', () => {
    if (!customerInput.value) return alert('Nhập tên khách');
    if (cart.length === 0) return alert('Chưa có hàng');
    const ngay = saleDateInput.value || new Date().toISOString().slice(0, 10);
    const popup = window.open('', '_blank');
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hóa đơn</title><style>
      body{font-family:Tahoma,Arial,sans-serif;font-size:14px;margin:20px;}
      .header{display:flex;gap:20px;margin-bottom:10px;}
      .header img{height:60px;}
      h2{color:#c00;text-align:center;margin:8px 0 2px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th,td{border:1px solid #000;padding:4px;text-align:center;}
      th{background:#f0f0f0;}
      .no-border td{border:none;text-align:left;padding:2px 0;}
    </style></head><body>`;
    html += `<div class="header"><img src="/logo.png" onerror="this.style.display='none'"/><div><strong>Điện Nước Minh Châu</strong><br/>MST: 8056681027-001<br/>Địa chỉ: Chợ Xuân Thọ, Đà Lạt<br/>Zalo: 0938039084</div></div>`;
    html += `<h2>HÓA ĐƠN BÁN HÀNG</h2><p style="text-align:center">Ngày ${ngay.split('-').reverse().join('-')}</p>`;
    html += `<table class="no-border"><tr><td><strong>Người mua:</strong> ${customerInput.value}</td></tr></table><br/>`;
    html += `<table><tr><th>STT</th><th>Tên hàng</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>`;
    let tong = 0;
    cart.forEach((it, i) => {
      const sub = it.qty * it.price;
      tong += sub;
      html += `<tr><td>${i + 1}</td><td style="text-align:left">${it.name}</td><td>${it.qty}</td><td>${it.price.toLocaleString()}</td><td>${sub.toLocaleString()}</td></tr>`;
    });
    html += `<tr><td colspan="4" style="text-align:right"><strong>Tổng cộng</strong></td><td><strong>${tong.toLocaleString()}</strong></td></tr></table>`;
    html += `<p style="margin-top:40px;text-align:center">Người mua hàng &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Người bán hàng</p>`;
    html += '</body></html>';
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  });

  detailBtn.addEventListener('click', () => {
    if (!saleDateInput.value) return alert('Chọn ngày');
    window.open('/chi-tiet-ban-hang?ngay=' + saleDateInput.value, '_blank');
  });
}
