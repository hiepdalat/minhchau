// scriptnhap-input.js

// --- 1. Hàm tiện ích và quản lý dữ liệu (tương tác với API) ---

function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function formatCurrency(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
}

let allReceipts = [];

async function loadReceipts() {
    console.log("Đang tải dữ liệu nhập hàng...");
    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) {
            if (response.status === 401) {
                console.warn("Chưa đăng nhập hoặc phiên hết hạn, chuyển hướng về trang đăng nhập.");
                window.location.href = '/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allReceipts = data;
        console.log("Dữ liệu nhập hàng đã tải:", allReceipts.length, "mục.");
        applyFilters();
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu nhập hàng từ server:", e);
    }
}

function applyFilters() {
    const searchDailyNameInput = document.getElementById('searchDailyNameInput');
    const searchMonthInput = document.getElementById('searchMonth');

    const searchTerm = searchDailyNameInput ? normalizeString(searchDailyNameInput.value) : '';
    const searchMonth = searchMonthInput ? searchMonthInput.value : '';

    console.log(`applyFilters: searchTerm='${searchTerm}', searchMonth='${searchMonth}'`);
    console.log(`allReceipts length before filter: ${allReceipts.length}`);

    const filteredReceipts = allReceipts.filter(item => {
        const normalizedDailyName = normalizeString(item.dailyName);
        const normalizedItemName = normalizeString(item.itemName);
        const matchesName = searchTerm === '' || normalizedDailyName.includes(searchTerm) || normalizedItemName.includes(searchTerm);

        let matchesMonth = true;
        if (searchMonth) {
            const itemMonth = item.receiptDate ? item.receiptDate.substring(0, 7) : '';
            matchesMonth = itemMonth === searchMonth;
        }

        return matchesName && matchesMonth;
    });

    console.log(`filteredReceipts length: ${filteredReceipts.length}`);
    renderReceiptsTable(filteredReceipts);
}

function renderReceiptsTable(receiptsToDisplay) {
    const receiptsBody = document.getElementById('receiptsBody');
    receiptsBody.innerHTML = '';

    const receiptsGrouped = {};
    receiptsToDisplay.forEach(item => {
        const receiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`;
        if (!receiptsGrouped[receiptKey]) {
            receiptsGrouped[receiptKey] = {
                dailyName: item.dailyName,
                receiptDate: item.receiptDate,
                items: []
            };
        }
        receiptsGrouped[receiptKey].items.push(item);
    });

    let grandTotal = 0;
    for (const key in receiptsGrouped) {
        const receipt = receiptsGrouped[key];

        const row = receiptsBody.insertRow();
        row.innerHTML = `
            <td class="py-2 px-4 font-semibold" colspan="6">
                <input type="checkbox" class="receipt-checkbox" data-receipt-key="${key}">
                Đại lý: ${receipt.dailyName} | Ngày: ${receipt.receiptDate}
            </td>
        `;

        receipt.items.forEach((item, index) => {
            const row = receiptsBody.insertRow();
            row.dataset.itemId = item.id;
            row.dataset.receiptKey = key;

            const itemPrice = parseFloat(item.itemPrice) || 0;
            const itemDiscount = parseFloat(item.itemDiscount) || 0;
            const itemQuantity = parseFloat(item.itemQuantity) || 0;

            const importPrice = itemPrice * (1 - itemDiscount / 100);
            const totalItemAmount = importPrice * itemQuantity;
            grandTotal += totalItemAmount;

            row.innerHTML = `
                <td class="py-2 px-4"></td>
                <td class="py-2 px-4">${item.itemName}</td>
                <td class="py-2 px-4">${item.itemUnit}</td>
                <td class="py-2 px-4">${item.itemQuantity}</td>
                <td class="py-2 px-4">${formatCurrency(item.itemPrice)}</td>
                <td class="py-2 px-4">${formatCurrency(totalItemAmount)}</td>
            `;
        });
    }

    const totalRow = receiptsBody.insertRow();
    totalRow.innerHTML = `
        <td colspan="5" class="text-right font-bold py-2 px-4">Tổng cộng:</td>
        <td class="py-2 px-4 font-bold">${formatCurrency(grandTotal)}</td>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters);

    document.getElementById('viewDetailsBtn')?.addEventListener('click', () => {
        const selectedKeys = Array.from(document.querySelectorAll('.receipt-checkbox:checked'))
            .map(cb => cb.dataset.receiptKey);

        if (selectedKeys.length !== 1) {
            Swal.fire('Chọn 1 dòng duy nhất', 'Vui lòng chọn đúng 1 phiếu để xem chi tiết.', 'warning');
            return;
        }

        const [dailyNameRaw, receiptDate] = selectedKeys[0].split('_');
        const dailyName = decodeURIComponent(dailyNameRaw);
        const detailURL = `/chi-tiet-phieu-nhap?daily=${encodeURIComponent(dailyName)}&ngay=${receiptDate}`;
        window.open(detailURL, '_blank');
    });

    setupDateTicker();
    loadReceipts();
});
