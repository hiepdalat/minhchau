/**
 * Loại bỏ dấu tiếng Việt (diacritics) khỏi chuỗi và chuyển về chữ thường.
 * @param {string} str - Chuỗi cần xử lý.
 * @returns {string} Chuỗi đã được loại bỏ dấu và chuyển về chữ thường.
 */
function removeDiacritics(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Định dạng giá trị số thành tiền tệ Việt Nam Đồng (VND).
 * @param {number} value - Giá trị số cần định dạng.
 * @returns {string} Chuỗi tiền tệ đã định dạng.
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(value);
}

let allReceipts = [];
const INITIAL_ROW_LIMIT = 10; // Giới hạn số lượng hàng ban đầu hiển thị

/**
 * Tải dữ liệu phiếu nhập hàng từ API và xử lý, sau đó hiển thị lên bảng.
 */
async function loadReceipts() {
    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        allReceipts = data.flatMap(row => {
            const ngay = row.ngay;
            const daily = row.daily;
            return Array.isArray(row.items) ? row.items.map(item => ({
                ngay,
                daily,
                tenhang: item.tenhang,
                dvt: item.dvt,
                soluong: item.soluong,
                dongia: item.dongia,
                ck: item.ck,
                gianhap: item.gianhap || 0,
                thanhtien: item.thanhtien || 0
            })) : [];
        });

        // Gọi applyFilters với cờ để chỉ hiển thị số lượng ban đầu khi tải trang
        applyFilters(true);
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu phiếu nhập hàng:", e);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi tải dữ liệu',
            text: 'Không thể tải dữ liệu phiếu nhập hàng. Vui lòng thử lại sau.'
        });
    }
}

/**
 * Áp dụng các bộ lọc (tìm kiếm theo tên đại lý/mặt hàng, theo tháng) và cập nhật bảng.
 * @param {boolean} [isInitialLoad=false] - True nếu đây là lần tải trang ban đầu (để giới hạn số hàng hiển thị).
 */
function applyFilters(isInitialLoad = false) {
    const searchTerm = removeDiacritics(document.getElementById('searchDailyNameInput')?.value.trim() || '');
    const searchMonth = document.getElementById('searchMonth')?.value || '';

    let filteredReceipts = allReceipts.filter(item => {
        const itemDate = item.ngay ? new Date(item.ngay) : null;
        const monthMatch = !searchMonth || (itemDate && itemDate.toISOString().slice(0, 7) === searchMonth);

        const dailyStr = removeDiacritics(item.daily || '');
        const itemNameStr = removeDiacritics(item.tenhang || '');

        const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemNameStr.includes(searchTerm);

        return monthMatch && searchMatch;
    });

    // --- THÊM ĐOẠN CODE SẮP XẾP VÀO ĐÂY ---
    // Sắp xếp dữ liệu theo ngày nhập giảm dần (mới nhất lên đầu)
    // Nếu ngày giống nhau, có thể thêm tiêu chí phụ (ví dụ: tên đại lý, tên hàng)
    filteredReceipts.sort((a, b) => {
        const dateA = a.ngay ? new Date(a.ngay) : new Date(0); // Mặc định về 0 nếu không có ngày
        const dateB = b.ngay ? new Date(b.ngay) : new Date(0);

        // Sắp xếp giảm dần: ngày B - ngày A
        return dateB.getTime() - dateA.getTime();
    });
    // --- KẾT THÚC ĐOẠN CODE SẮP XẾP ---


    if (isInitialLoad && !searchTerm && !searchMonth) {
        renderReceiptsTable(filteredReceipts.slice(0, INITIAL_ROW_LIMIT));
    } else {
        renderReceiptsTable(filteredReceipts);
    }
}
/**
 * Render dữ liệu phiếu nhập hàng vào bảng HTML.
 * @param {Array<Object>} receipts - Mảng các đối tượng phiếu nhập hàng cần hiển thị.
 */
function renderReceiptsTable(receipts) {
    const tbody = document.querySelector('#receiptsTable tbody');
    if (!tbody) {
        console.error("Lỗi: Không tìm thấy phần tử tbody có ID 'receiptsTable'.");
        return;
    }
    tbody.innerHTML = '';

    const fragment = document.createDocumentFragment();

    receipts.forEach((item) => {
        const tr = document.createElement('tr');
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
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment); // Chèn một lần để tối ưu hiệu suất
}

document.addEventListener('DOMContentLoaded', () => {
    // Gắn sự kiện cho các bộ lọc
    document.getElementById('searchBtn')?.addEventListener('click', () => applyFilters(false));
    document.getElementById('searchDailyNameInput')?.addEventListener('input', () => applyFilters(false));
    document.getElementById('searchMonth')?.addEventListener('change', () => applyFilters(false));

    // Gắn sự kiện cho nút xem chi tiết
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
            console.error("Lỗi: receiptKey không xác định.");
            return;
        }

        const [dailyNameEncoded, receiptDate] = receiptKey.split('_');
        const dailyName = decodeURIComponent(dailyNameEncoded);

        const detailURL = `/print-receipt.html?daily=${encodeURIComponent(dailyName)}&date=${receiptDate}`;
        window.open(detailURL, '_blank');
    });

    // Tải dữ liệu khi DOM đã sẵn sàng
    loadReceipts();
});
