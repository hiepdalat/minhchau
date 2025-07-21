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
    renderReceiptTable(filteredReceipts); // Đã sửa đúng tên hàm
}

function renderReceiptTable(receipts) {
    console.log("⏬ Dữ liệu truyền vào bảng:");
    console.log(receipts);

    const tbody = document.querySelector("#receiptsTable tbody");
    if (!tbody) {
        console.error("Không tìm thấy tbody của bảng receiptsTable.");
        return;
    }
    tbody.innerHTML = "";

    const grouped = {};
    receipts.forEach(item => {
        console.log("📄 Item:", item);

        const key = `${item.receiptDate}__${item.dailyName}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });

    Object.keys(grouped).forEach(receiptKey => {
        const [receiptDate, dailyName] = receiptKey.split("__");
        const items = grouped[receiptKey];

        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
            <td colspan="10" class="bg-gray-700 text-white font-semibold">
                ▶️ Đại lý: ${dailyName} | Ngày: ${receiptDate}
            </td>`;
        tbody.appendChild(headerRow);

        items.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="checkbox" class="receipt-checkbox" data-receipt-key="${normalizeString(item.dailyName)}_${item.receiptDate}"></td>
                <td>${item.receiptDate}</td>
                <td>${item.dailyName}</td>
                <td>${item.itemName}</td>
                <td>${item.itemUnit}</td>
                <td>${item.itemQuantity}</td>
                <td>${formatCurrency(item.itemPrice)}</td>
                <td>${item.itemDiscount || 0}%</td>
                <td>${formatCurrency(item.importPrice)}</td>
                <td>${formatCurrency(item.totalItemAmount)}</td>`;
            tbody.appendChild(row);
        });
    });
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

    // Nếu có ticker thời gian bạn có thể bật lại
    // setupDateTicker();

    loadReceipts();
});
