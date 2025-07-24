function removeDiacritics(str) {
    if (typeof str !== 'string') return ''; // Ensure it's a string
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(value);
}

let allReceipts = []; // This will store the flattened item data

async function loadReceipts() {
    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // ✅ Chuyển đổi từ receipts dạng nhóm sang từng mặt hàng
        allReceipts = [];
        data.forEach(receipt => {
            const receiptDate = receipt.ngay?.substring(0, 10); // Ensure consistent date format
            const dailyName = receipt.daily;

            receipt.items.forEach(item => {
                const itemPrice = parseFloat(item.dongia) || 0;
                const itemQuantity = parseFloat(item.soluong) || 0;
                const itemDiscount = parseFloat(item.ck) || 0;
                const importPrice = itemPrice * (1 - itemDiscount / 100);
                const totalItemAmount = importPrice * itemQuantity;

    allReceipts.push({
        receiptDate,
        dailyName,
        itemName: item.tenhang,
        itemUnit: item.dvt,
        itemQuantity,
        itemPrice,
        itemDiscount,
        importPrice,
        totalItemAmount
    });
});
        });
        console.log("✅ Chuyển đổi thành công. Số dòng hàng:", allReceipts.length);
        applyFilters(); // Apply filters immediately after loading data
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu nhập hàng từ server:", e);
    }
}

function applyFilters() {
    const searchTerm = removeDiacritics(document.getElementById('searchDailyNameInput')?.value.trim() || '');
    const searchMonth = document.getElementById('searchMonth')?.value || '';

    console.log(`applyFilters: searchTerm='${searchTerm}', searchMonth='${searchMonth}'`);

    const filteredReceipts = allReceipts.filter(item => { // 'item' here refers to a single line item
        const itemDate = item.receiptDate ? new Date(item.receiptDate) : null;
        const monthMatch = !searchMonth || (itemDate && itemDate.toISOString().slice(0, 7) === searchMonth);

        // For search term, check both dailyName and itemName of the current item
        const dailyStr = removeDiacritics(item.dailyName || '').toLowerCase();
        const itemNameStr = removeDiacritics(item.itemName || '').toLowerCase();

        const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemNameStr.includes(searchTerm);

        return monthMatch && searchMatch;
    });

    console.log('filteredReceipts length: ' + filteredReceipts.length);
    renderReceiptsTable(filteredReceipts);
}

function renderReceiptsTable(receipts) {
  const tbody = document.querySelector('#receiptsTable tbody');
  tbody.innerHTML = '';

  receipts.forEach((item, index) => {
    const tr = document.createElement('tr');
    const receiptKey = encodeURIComponent(item.dailyName) + '_' + item.receiptDate;

    tr.innerHTML = `
      <td><input type="checkbox" class="receiptCheckbox" data-receipt-key="${receiptKey}"></td>
      <td>${new Date(item.receiptDate).toLocaleDateString('vi-VN')}</td>
      <td>${item.dailyName}</td>
      <td>${item.itemName}</td>
      <td>${item.itemUnit}</td>
      <td>${item.itemQuantity}</td>
      <td>${formatCurrency(item.itemPrice)}</td>
      <td>${item.itemDiscount}%</td>
      <td>${formatCurrency(item.importPrice)}</td>
      <td>${formatCurrency(item.totalItemAmount)}</td>
    `;
    tbody.appendChild(tr);
  });
}
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    // Use 'input' event for real-time filtering as user types
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters);

    document.getElementById('viewDetailsBtn')?.addEventListener('click', () => {
        const selectedCheckboxes = Array.from(document.querySelectorAll('.receiptCheckbox:checked'));

        if (selectedCheckboxes.length !== 1) {
            Swal.fire({
                icon: 'warning',
                title: 'Chọn 1 phiếu duy nhất',
                text: 'Vui lòng chọn đúng 1 phiếu để xem chi tiết.'
            });
            return;
        }

        const checkbox = selectedCheckboxes[0];
        const receiptKey = checkbox.dataset.receiptKey; // Get the combined key
        if (!receiptKey) {
            console.error("receiptKey is undefined for selected checkbox.");
            return;
        }
        const [dailyNameEncoded, receiptDate] = receiptKey.split('_');
        const dailyName = decodeURIComponent(dailyNameEncoded); // Decode the daily name

        const detailURL = `/print-receipt.html?daily=${encodeURIComponent(dailyName)}&ngay=${receiptDate}`;
        window.open(detailURL, '_blank');
    });

    loadReceipts(); // Load data when the DOM is ready
});
