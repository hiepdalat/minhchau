document.addEventListener('DOMContentLoaded', () => {
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

  let items = [];
  dateInput.valueAsDate = new Date();

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
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${it.name}</td>
        <td>${it.unit}</td>
        <td>${it.qty}</td>
        <td>${it.price.toLocaleString()}</td>
        <td>${it.discount}%</td>
        <td>${giaNhap.toLocaleString()}</td>
        <td>${thanhTien.toLocaleString()}</td>
        <td><button class="btn btn-danger btn-sm" data-idx="${idx}"><i class="fa fa-trash"></i></button></td>
      `;
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
    productInput.value = '';
    unitInput.value = '';
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
    if (!supplierInput.value) {
      alert('Vui lòng nhập tên đại lý');
      return;
    }
    if (items.length === 0) {
      alert('Chưa có mặt hàng nào');
      return;
    }
    const payload = {
      supplier: supplierInput.value,
      date: dateInput.value,
      items
    };
    fetch('/api/stock/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
    const date = dateInput.value;
    if (!date) {
      alert('Vui lòng chọn ngày để xem chi tiết phiếu nhập');
      return;
    }
    window.open('/chi-tiet-phieu-nhap?ngay=' + date, '_blank');
  });
});
