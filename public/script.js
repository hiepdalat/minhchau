// 📦 GỘP CẢ 3 MODULE: Đăng nhập + Công nợ + Nhập hàng + Mới: Tìm kiếm đại lý, xem đơn hàng theo ngày

const SESSION_IDLE_LIMIT = 5 * 60 * 1000;
let idleTimer;
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

// ========== HIỂN THỊ NGÀY TỰ ĐỘNG =============
(() => {
  const thuVN = ['Chủ nhật','Hai','Ba','Tư','Năm','Sáu','Bảy'];
  function buildText(){
    const d = new Date();
    return `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()} – Chúc bạn một ngày làm việc thật hiệu quả!`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('tickerWrap');
    if (wrap) wrap.textContent = buildText();
  });
})();

// ========== ĐĂNG XUẤT =============
function dangXuat() {
  fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/index.html');
}

// ========== PHÂN TRANG =============
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'nhaphang') initNhapHang();
});

// ========== MODULE NHẬP HÀNG =============
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
  const suggestions = document.getElementById('suggestions');
  const loadOrdersBtn = document.getElementById('loadOrdersBtn');

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

  // ======= Tìm kiếm đại lý =======
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (!q) return suggestions.innerHTML = '';
    fetch('/api/search-supplier?kw=' + encodeURIComponent(q))
      .then(r => r.json())
      .then(data => {
        suggestions.innerHTML = data.map(name => `<div class="suggestion-item">${name}</div>`).join('');
      });
  });

  suggestions.addEventListener('click', (e) => {
    const name = e.target.textContent;
    if (name) {
      searchInput.value = name;
      suggestions.innerHTML = '';
    }
  });

  // ======= Xem đơn hàng theo ngày =======
  loadOrdersBtn.addEventListener('click', () => {
    const ten = searchInput.value.trim();
    if (!ten) return alert('Vui lòng nhập tên đại lý');
    fetch('/api/supplier-orders?ten=' + encodeURIComponent(ten))
      .then(r => r.json())
      .then(data => {
        if (!data.length) return alert('Không có đơn hàng');
        const html = data.map(ngay => `<label><input type="radio" name="ngayNhap" value="${ngay}"> ${ngay}</label>`).join('<br/>');
        Swal.fire({
          title: 'Chọn ngày để xem',
          html,
          showCancelButton: true,
          confirmButtonText: 'Xem chi tiết',
          preConfirm: () => {
            const val = document.querySelector('input[name="ngayNhap"]:checked')?.value;
            if (!val) return Swal.showValidationMessage('Chọn 1 ngày');
            return val;
          }
        }).then(r => {
          if (r.isConfirmed && r.value)
            window.open('/chi-tiet-phieu-nhap?ngay=' + r.value, '_blank');
        });
      });
  });
}
