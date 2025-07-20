document.addEventListener('DOMContentLoaded', () => {
  const dailyNameInput = document.getElementById('dailyName');
  const receiptDateInput = document.getElementById('receiptDate');
  const itemNameInput = document.getElementById('itemName');
  const itemUnitInput = document.getElementById('itemUnit');
  const itemQuantityInput = document.getElementById('itemQuantity');
  const itemPriceInput = document.getElementById('itemPrice');
  const addItemBtn = document.getElementById('addItem');
  const saveReceiptBtn = document.getElementById('saveReceipt');
  const itemTableBody = document.getElementById('itemTableBody');
  const searchQueryInput = document.getElementById('searchQuery');
  const searchMonthInput = document.getElementById('searchMonth');
  const searchBtn = document.getElementById('searchBtn');
  const receiptsTableBody = document.getElementById('receiptsTableBody');

  let currentItems = [];

  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function renderCurrentItems() {
    itemTableBody.innerHTML = '';
    currentItems.forEach((item, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.unit}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td>${item.quantity * item.price}</td>
          <td><button class="text-red-600 delete-item" data-index="${index}">Xóa</button></td>
        </tr>
      `;
      itemTableBody.insertAdjacentHTML('beforeend', row);
    });

    document.querySelectorAll('.delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        currentItems.splice(idx, 1);
        renderCurrentItems();
      });
    });
  }

  addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const unit = itemUnitInput.value.trim();
    const quantity = parseFloat(itemQuantityInput.value);
    const price = parseFloat(itemPriceInput.value);

    if (!name || !unit || isNaN(quantity) || isNaN(price)) {
      alert('Vui lòng nhập đầy đủ thông tin món hàng.');
      return;
    }

    currentItems.push({ name, unit, quantity, price });
    renderCurrentItems();

    itemNameInput.value = '';
    itemUnitInput.value = '';
    itemQuantityInput.value = '';
    itemPriceInput.value = '';
  });

  saveReceiptBtn.addEventListener('click', async () => {
    const supplier = dailyNameInput.value.trim();
    const date = receiptDateInput.value;

    if (!supplier || !date || currentItems.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin và ít nhất một món hàng.');
      return;
    }

    try {
      const res = await fetch('/api/nhaphang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier, date, items: currentItems })
      });

      const result = await res.json();
      if (res.ok) {
        alert('Lưu phiếu nhập thành công!');
        currentItems = [];
        renderCurrentItems();
        loadReceipts(); // reload danh sách
      } else {
        alert('Lỗi khi lưu: ' + result.error);
      }
    } catch (error) {
      console.error('Lỗi khi lưu phiếu nhập:', error);
    }
  });

  async function loadReceipts() {
    const query = removeDiacritics(searchQueryInput.value.trim());
    const month = searchMonthInput.value;

    try {
      const res = await fetch(`/api/nhaphang?q=${encodeURIComponent(query)}&month=${month}`);
      const data = await res.json();
      renderReceipts(data);
    } catch (error) {
      console.error('Lỗi khi tải phiếu nhập:', error);
    }
  }

  function renderReceipts(data) {
    receiptsTableBody.innerHTML = '';
    data.forEach((receipt, idx) => {
      const total = receipt.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      const row = `
        <tr>
          <td>${idx + 1}</td>
          <td>${receipt.supplier}</td>
          <td>${new Date(receipt.date).toLocaleDateString()}</td>
          <td>${receipt.items.length}</td>
          <td>${total.toLocaleString()} đ</td>
          <td>
            <button class="text-blue-600 view-detail" data-id="${receipt._id}">Chi tiết</button> |
            <button class="text-red-600 delete-receipt" data-id="${receipt._id}">Xóa</button>
          </td>
        </tr>
      `;
      receiptsTableBody.insertAdjacentHTML('beforeend', row);
    });

    document.querySelectorAll('.delete-receipt').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Bạn có chắc muốn xóa phiếu này?')) {
          try {
            const res = await fetch(`/api/nhaphang/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok) {
              alert('Đã xóa phiếu!');
              loadReceipts();
            } else {
              alert(result.error || 'Lỗi khi xóa.');
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
    });

    document.querySelectorAll('.view-detail').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        try {
          const res = await fetch(`/api/nhaphang/${id}`);
          const receipt = await res.json();
          let chiTiet = `Nhà cung cấp: ${receipt.supplier}\nNgày: ${new Date(receipt.date).toLocaleDateString()}\n\n`;
          chiTiet += receipt.items.map((item, i) => 
            `${i + 1}. ${item.name} - SL: ${item.quantity}, ĐG: ${item.price}, TT: ${item.quantity * item.price}`
          ).join('\n');
          alert(chiTiet);
        } catch (err) {
          console.error(err);
          alert('Không thể tải chi tiết.');
        }
      });
    });
  }

  searchBtn.addEventListener('click', loadReceipts);

  // Tải danh sách ban đầu
  loadReceipts();
});
