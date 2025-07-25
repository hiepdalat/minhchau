function removeDiacritics(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(value);
}

let allReceipts = [];
const INITIAL_ROW_LIMIT = 10; // <<-- Hằng số mới: giới hạn 10 hàng ban đầu

async function loadReceipts() {
    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        console.log("✅ Dữ liệu thô từ server:", data);

        allReceipts = [];

        data.forEach(row => {
            const ngay = row.ngay;
            const daily = row.daily;

            if (Array.isArray(row.items)) {
                row.items.forEach(item => {
                    allReceipts.push({
                        ngay,
                        daily,
                        tenhang: item.tenhang,
                        dvt: item.dvt,
                        soluong: item.soluong,
                        dongia: item.dongia,
                        ck: item.ck,
                        gianhap: item.gianhap || 0,
                        thanhtien: item.thanhtien || 0
                    });
                });
            }
        });

        console.log("✅ Dữ liệu đã tải:", allReceipts.length, "mặt hàng.");
                
        // Gọi applyFilters với cờ để chỉ hiển thị số lượng ban đầu
        applyFilters(true); // <<-- Truyền true để chỉ thị đây là lần tải ban đầu
    } catch (e) {
        console.error("❌ Lỗi khi tải dữ liệu:", e);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi tải dữ liệu',
            text: 'Không thể tải dữ liệu phiếu nhập hàng. Vui lòng thử lại sau.'
        });
    }
}

// Thêm tham số `isInitialLoad`
function applyFilters(isInitialLoad = false) { // <<-- Mặc định là false
    console.log("🧪 Tổng số dòng dữ liệu trước lọc:", allReceipts.length);
    console.log("🧪 allReceipts[0] =", allReceipts[0]);
    const searchTerm = removeDiacritics(document.getElementById('searchDailyNameInput')?.value.trim() || '');
    const searchMonth = document.getElementById('searchMonth')?.value || '';

    console.log(`🔍 Bộ lọc: từ khóa='${searchTerm}', tháng='${searchMonth}'`);

    let filteredReceipts = allReceipts.filter(item => {
        const itemDate = item.ngay ? new Date(item.ngay) : null;
        const monthMatch = !searchMonth || (itemDate && itemDate.toISOString().slice(0, 7) === searchMonth);

        const dailyStr = removeDiacritics(item.daily || '');
        const itemNameStr = removeDiacritics(item.tenhang || '');

        const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemNameStr.includes(searchTerm);

        return monthMatch && searchMatch;
    });

    console.log("✅ Số kết quả sau lọc:", filteredReceipts.length);

    if (filteredReceipts.length > 0) {
        console.log("🧾 Một dòng đầu tiên rõ ràng:", JSON.stringify(filteredReceipts[0], null, 2));
    } else {
        console.warn("⚠️ Không có dữ liệu sau lọc.");
    }

    // Nếu là tải ban đầu và không có bộ lọc tìm kiếm nào, giới hạn số lượng hiển thị
    if (isInitialLoad && !searchTerm && !searchMonth) {
        renderReceiptsTable(filteredReceipts.slice(0, INITIAL_ROW_LIMIT)); // <<-- Giới hạn ở đây
        // Có thể thêm một thông báo "Hiển thị 10 dòng đầu tiên. Hãy dùng bộ lọc để xem thêm."
    } else {
        renderReceiptsTable(filteredReceipts); // <<-- Hiển thị tất cả khi có bộ lọc
    }
}

function renderReceiptsTable(receipts) {
    const tbody = document.querySelector('#receiptsTable tbody');
    if (!tbody) {
        console.error("Error: tbody element with ID 'receiptsTable' not found.");
        return;
    }
    tbody.innerHTML = '';

    receipts.forEach((item) => {
        const tr = document.createElement('tr');
        // Đảm bảo item.ngay là một chuỗi ngày hợp lệ trước khi tạo Date object
        const formattedDateForUrl = item.ngay ? new Date(item.ngay).toISOString().split('T')[0] : '';
        const receiptKey = `${encodeURIComponent(item.daily || '')}_${formattedDateForUrl}`;

        tr.innerHTML = `
            <td><input type="checkbox" class="receiptCheckbox" data-receipt-key="${receiptKey}"></td>
            <td>${item.ngay ? new Date(item.ngay).toLocaleDateString('vi-VN') : ''}</td>
            <td>${item.daily || ''}</td>
            <td>${item.tenhang || ''}</td>
            <td>${item.dvt || ''}</td>
            <td>${item.soluong || 0}</td>
            <td>${formatCurrency(item.dongia || 0)}</td>
            <td>${(item.ck || 0)}%</td>
            <td>${formatCurrency(item.gianhap || 0)}</td>
            <td>${formatCurrency(item.thanhtien || 0)}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchBtn')?.addEventListener('click', () => applyFilters(false)); // Khi bấm tìm, hiển thị tất cả
    document.getElementById('searchDailyNameInput')?.addEventListener('input', () => applyFilters(false)); // Khi gõ, hiển thị tất cả
    document.getElementById('searchMonth')?.addEventListener('change', () => applyFilters(false)); // Khi đổi tháng, hiển thị tất cả

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
        const receiptKey = checkbox.dataset.receiptKey;
        if (!receiptKey) {
            console.error("receiptKey is undefined.");
            return;
        }

        const [dailyNameEncoded, receiptDate] = receiptKey.split('_');
        const dailyName = decodeURIComponent(dailyNameEncoded);

        const detailURL = `/print-receipt.html?daily=${encodeURIComponent(dailyName)}&date=${receiptDate}`;
        window.open(detailURL, '_blank');
    });

    loadReceipts(); // Hàm này sẽ gọi applyFilters(true) ban đầu
});
