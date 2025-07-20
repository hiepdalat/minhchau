// scriptnhap-input.js

let currentItems = [];

function formatCurrency(number) {
    return Number(number).toLocaleString('vi-VN');
}

function removeVietnameseTones(str) {
    return str.normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

function renderCurrentItems() {
    const tbody = document.querySelector('#inputTable tbody');
    tbody.innerHTML = '';
    currentItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.quantity * item.price)}</td>
            <td><button onclick="removeItem(${index})" class="text-red-500">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
    updateTotalSummary();
}

function removeItem(index) {
    currentItems.splice(index, 1);
    renderCurrentItems();
}

function updateTotalSummary() {
    let total = 0;
    currentItems.forEach(item => total += item.quantity * item.price);
    document.getElementById('tongTien').textContent = formatCurrency(total);
}

document.getElementById('addItemBtn').addEventListener('click', () => {
    const name = document.getElementById('itemName').value.trim();
    const unit = document.getElementById('itemUnit').value.trim();
    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!name || !unit || isNaN(quantity) || isNaN(price)) {
        alert('Vui lòng nhập đầy đủ và hợp lệ.');
        return;
    }

    currentItems.push({ name, unit, quantity, price });
    renderCurrentItems();

    document.getElementById('itemName').value = '';
    document.getElementById('itemUnit').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
});

document.getElementById('saveReceiptBtn').addEventListener('click', async () => {
    const supplier = document.getElementById('dailyName').value.trim();
    const date = document.getElementById('receiptDate').value;

    if (!supplier || !date || currentItems.length === 0) {
        alert('Vui lòng điền đủ thông tin và ít nhất 1 món hàng.');
        return;
    }

    const response = await fetch('/api/nhaphang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier, date, items: currentItems })
    });

    if (response.ok) {
        alert('Đã lưu phiếu nhập.');
        currentItems = [];
        renderCurrentItems();
        loadReceipts();
    } else {
        alert('Lỗi khi lưu phiếu.');
    }
});

async function loadReceipts() {
    const res = await fetch('/api/nhaphang');
    const data = await res.json();
    const tbody = document.querySelector('#receiptsTable tbody');
    tbody.innerHTML = '';
    data.forEach((r, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.supplier}</td>
            <td>${r.date}</td>
            <td>${formatCurrency(r.total || 0)}</td>
            <td>
                <button onclick="viewDetails('${r._id}')" class="text-blue-500">👁️</button>
                <button onclick="deleteReceipt('${r._id}')" class="text-red-500">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function viewDetails(id) {
    const res = await fetch(`/api/nhaphang/${id}`);
    const data = await res.json();
    const content = data.items.map((item, i) => `
        ${i + 1}. ${item.name} - SL: ${item.quantity} - Đơn giá: ${formatCurrency(item.price)} - Thành tiền: ${formatCurrency(item.quantity * item.price)}
    `).join('\n');
    alert(`Phiếu nhập ngày ${data.date} - Đại lý: ${data.supplier}\n\n${content}`);
}

async function deleteReceipt(id) {
    const confirmDelete = confirm('Bạn có chắc muốn xóa phiếu này?');
    if (!confirmDelete) return;

    const res = await fetch(`/api/nhaphang/${id}`, { method: 'DELETE' });
    if (res.ok) {
        alert('Đã xóa phiếu.');
        loadReceipts();
    } else {
        alert('Không thể xóa.');
    }
}

document.getElementById('searchInput').addEventListener('input', async () => {
    const keyword = removeVietnameseTones(document.getElementById('searchInput').value.trim().toLowerCase());
    const res = await fetch('/api/nhaphang');
    const data = await res.json();
    const tbody = document.querySelector('#receiptsTable tbody');
    tbody.innerHTML = '';
    data.filter(r => removeVietnameseTones(r.supplier.toLowerCase()).includes(keyword)).forEach((r, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.supplier}</td>
            <td>${r.date}</td>
            <td>${formatCurrency(r.total || 0)}</td>
            <td>
                <button onclick="viewDetails('${r._id}')" class="text-blue-500">👁️</button>
                <button onclick="deleteReceipt('${r._id}')" class="text-red-500">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    loadReceipts();
});
