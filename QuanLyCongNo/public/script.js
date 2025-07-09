// script.js – Gộp từ công nợ + nhập hàng + bán hàng + tìm kiếm

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
['click','mousemove','keydown','scroll','touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer));
resetIdleTimer();

// ================= TICKER NGÀY ===================
(() => {
  const thuVN = ['Chủ nhật','Hai','Ba','Tư','Năm','Sáu','Bảy'];
  function buildText() {
    const d = new Date();
    return `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()} – Chúc bạn một ngày làm việc thật hiệu quả!`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('tickerWrap');
    if (wrap) wrap.textContent = buildText();
  });
})();

// ================= HỖ TRỢ ĐA TRANG ===================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'congno') initCongNo();
  if (page === 'nhaphang') initNhapHang();
  if (page === 'banhang') initBanHang();
});

// ============== MODULE NHẬP HÀNG ===================
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
  const searchInput = document.getElementById('searchSupplier');
  const searchBtn = document.getElementById('btnSearch');
  const tableSearch = document.getElementById('searchResult');
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
    if (!name || !unit || qty <= 0) return alert('Vui lòng nhập đầy đủ thông tin sản phẩm.');
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

  // ======== Tìm kiếm đại lý ========
  searchBtn?.addEventListener('click', () => {
    const name = searchInput.value.trim();
    if (!name) return;
    fetch('/api/stock/search?ten=' + encodeURIComponent(name))
      .then(res => res.json())
      .then(data => {
        tableSearch.innerHTML = '';
        if (!data.length) return tableSearch.innerHTML = '<tr><td colspan="5">Không tìm thấy</td></tr>';
        data.forEach((r, i) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td><input type="checkbox" data-ngay="${r.ngay.slice(0,10)}"></td><td>${r.daily}</td><td>${r.ngay.slice(0,10)}</td><td>${r.tongtien.toLocaleString()}</td><td>${r.items.length} món</td>`;
          tableSearch.appendChild(tr);
        });
      });
  });

  document.getElementById('btnDetailDonHang')?.addEventListener('click', () => {
    const checked = tableSearch.querySelector('input[type="checkbox"]:checked');
    if (!checked) return alert('Chọn đơn hàng cần xem');
    const ngay = checked.dataset.ngay;
    window.open('/chi-tiet-phieu-nhap?ngay=' + ngay, '_blank');
  });
}

function initCongNo() {
  console.log('▶ Trang công nợ');
  // placeholder
}

function initBanHang() {
  console.log('▶ Trang bán hàng');
  // placeholder
}
