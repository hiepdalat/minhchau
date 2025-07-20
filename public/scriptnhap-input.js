document.addEventListener('DOMContentLoaded', () => {
  const supplierInput = document.getElementById('dailyName');
  const dateInput = document.getElementById('receiptDate');
  const itemNameInput = document.getElementById('itemName');
  const itemUnitInput = document.getElementById('itemUnit');
  const itemQuantityInput = document.getElementById('itemQuantity');
  const itemPriceInput = document.getElementById('itemPrice');
  const addItemButton = document.getElementById('addItemBtn');
  const saveReceiptButton = document.getElementById('saveReceiptBtn');
  const itemTableBody = document.querySelector('#itemTable tbody');
  const receiptResultsBody = document.querySelector('#receiptResults tbody');
  const filterInput = document.getElementById('filterInput');
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');

  let currentItems = [];

  function toUnsigned(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function formatNumber(n) {
    return n.toLocaleString("vi-VN");
  }

  function renderItems() {
    itemTableBody.innerHTML = '';
    currentItems.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.unit}</td>
        <td>${item.quantity}</td>
        <td>${formatNumber(item.price)}</td>
        <td>${formatNumber(item.quantity * item.price)}</td>
        <td><button class="text-red-600 font-bold delete-item-btn" data-index="${index}">X</button></td>
      `;
      itemTableBody.appendChild(row);
    });
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.dataset.index;
        currentItems.splice(index, 1);
        renderItems();
      });
    });
  }

  addItemButton.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const unit = itemUnitInput.value.trim();
    const quantity = parseFloat(itemQuantityInput.value);
    const price = parseFloat(itemPriceInput.value);

    if (!name || !unit || isNaN(quantity) || isNaN(price)) {
      alert('Vui lòng nhập đầy đủ và đúng thông tin mặt hàng.');
      return;
    }

    currentItems.push({ name, unit, quantity, price });
    renderItems();

    itemNameInput.value = '';
    itemUnitInput.value = '';
    itemQuantityInput.value = '';
    itemPriceInput.value = '';
    itemNameInput.focus();
  });

  saveReceiptButton.addEventListener('click', async () => {
    const supplier = supplierInput.value.trim();
    const date = dateInput.value;

    if (!supplier || !date || currentItems.length === 0) {
      alert('Vui lòng nhập đầy đủ thông tin và ít nhất 1 mặt hàng.');
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
        alert('Đã lưu phiếu nhập.');
        currentItems = [];
        renderItems();
        loadReceipts(); // reload
      } else {
        alert(result.error || 'Lỗi khi lưu phiếu.');
      }
    } catch (err) {
      alert('Lỗi khi gửi dữ liệu.');
      console.error(err);
    }
  });

  async function loadReceipts() {
    try {
      const query = toUnsigned(filterInput.value.trim());
      const month = filterMonth.value;
      const year = filterYear.value;
      const res = await fetch(`/api/receipts?q=${query}&month=${month}&year=${year}`);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error('Dữ liệu không hợp lệ');

      receiptResultsBody.innerHTML = '';
      data.forEach((r, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${r.supplier}</td>
          <td>${r.date?.slice(0, 10)}</td>
          <td>${r.items.length}</td>
          <td>${formatNumber(r.items.reduce((t, i) => t + i.quantity * i.price, 0))}</td>
          <td>
            <button class="text-blue-600 font-bold view-btn" data-id="${r._id}">Xem</button> |
            <button class="text-red-600 font-bold delete-btn" data-id="${r._id}">Xóa</button>
          </td>
        `;
        receiptResultsBody.appendChild(row);
      });

      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const res = await fetch(`/api/receipt/${id}`);
          const receipt = await res.json();
          alert(`Phiếu nhập từ: ${receipt.supplier}\nNgày: ${receipt.date}\nTổng món: ${receipt.items.length}`);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Xóa phiếu nhập này?')) return;
          const id = btn.dataset.id;
          const res = await fetch(`/api/receipt/${id}`, { method: 'DELETE' });
          if (res.ok) {
            alert('Đã xóa.');
            loadReceipts();
          } else {
            alert('Lỗi khi xóa phiếu.');
          }
        });
      });

    } catch (err) {
      console.error('Lỗi khi tải phiếu nhập:', err);
    }
  }

  filterInput.addEventListener('input', loadReceipts);
  filterMonth.addEventListener('change', loadReceipts);
  filterYear.addEventListener('change', loadReceipts);

  loadReceipts(); // initial
});
