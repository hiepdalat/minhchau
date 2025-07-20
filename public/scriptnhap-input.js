// scriptnhap-input.js

// --- 1. Hàm tiện ích và quản lý dữ liệu (tương tác với API) ---

/**
 * Chuẩn hóa chuỗi: bỏ dấu tiếng Việt, chuyển về chữ thường, và cắt khoảng trắng đầu/cuối.
 * @param {string} str - Chuỗi cần chuẩn hóa.
 * @returns {string} Chuỗi đã được chuẩn hóa.
 */
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Định dạng số tiền về định dạng tiền tệ Việt Nam (VND).
 * @param {number} amount - Số tiền.
 * @returns {string} Chuỗi số tiền đã được định dạng.
 */
function formatCurrency(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
}

// Biến toàn cục để lưu trữ tất cả các phiếu nhập (tải từ API)
let allReceipts = [];

/**
 * Tải danh sách phiếu nhập từ API backend.
 */
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
        allReceipts = data; // Cập nhật biến toàn cục
        console.log("Dữ liệu nhập hàng đã tải:", allReceipts.length, "mục.");
        applyFilters(); // Áp dụng bộ lọc và render lại bảng sau khi tải dữ liệu
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu nhập hàng từ server:", e);
        Swal.fire('Lỗi!', 'Không thể tải dữ liệu nhập hàng. Vui lòng thử lại sau.', 'error');
        allReceipts = []; // Đảm bảo allReceipts là mảng rỗng nếu có lỗi
        applyFilters(); // Vẫn render bảng trống nếu có lỗi
    }
}

// --- 2. Hiển thị dữ liệu lên bảng ---

/**
 * Hiển thị các phiếu nhập lên bảng 'receiptsTable'.
 * Đồng thời nhóm các mặt hàng để tính tổng tiền phiếu và hiển thị checkbox.
 * @param {Array<Object>} receiptsToDisplay - Mảng các mặt hàng (từ các phiếu nhập) cần hiển thị.
 */
function renderReceiptsTable(receiptsToDisplay) {
    const receiptsBody = document.getElementById('receiptsBody');
    if (!receiptsBody) {
        console.error("Không tìm thấy phần tử 'receiptsBody'.");
        return;
    }

    receiptsBody.innerHTML = ''; // Xóa nội dung cũ
    let grandTotal = 0;

    if (receiptsToDisplay.length === 0) {
        receiptsBody.innerHTML = '<tr><td colspan="11" class="py-4 text-center text-gray-400">Không có dữ liệu phiếu nhập nào khớp với tiêu chí tìm kiếm.</td></tr>';
        document.getElementById('grandTotalAllItems').textContent = formatCurrency(0);
        return;
    }

    // Nhóm các mặt hàng theo phiếu nhập để tính tổng tiền phiếu và hiển thị gộp hàng
    const receiptsGrouped = {};
    receiptsToDisplay.forEach(item => {
        const receiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`; // Key duy nhất cho mỗi phiếu
        if (!receiptsGrouped[receiptKey]) {
            receiptsGrouped[receiptKey] = {
                dailyName: item.dailyName,
                receiptDate: item.receiptDate,
                items: [],
                totalReceiptAmount: 0
            };
        }
        receiptsGrouped[receiptKey].items.push(item);
    });

    // Tính toán tổng tiền cho từng phiếu nhập đã nhóm
    for (const key in receiptsGrouped) {
        let currentReceiptTotal = 0;
        receiptsGrouped[key].items.forEach(item => {
            const itemPrice = parseFloat(item.itemPrice) || 0;
            const itemDiscount = parseFloat(item.itemDiscount) || 0;
            const itemQuantity = parseFloat(item.itemQuantity) || 0;

            const importPrice = itemPrice * (1 - itemDiscount / 100);
            const totalItemAmount = importPrice * itemQuantity;
            currentReceiptTotal += totalItemAmount;
        });
        receiptsGrouped[key].totalReceiptAmount = currentReceiptTotal;
    }

    // Render các hàng vào bảng
    for (const key in receiptsGrouped) {
        const receipt = receiptsGrouped[key];
        const numItemsInReceipt = receipt.items.length;

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
                <td class="py-2 px-4"><input type="checkbox" class="receipt-checkbox" data-receipt-key="${key}"></td>
                <td class="py-2 px-4">${item.receiptDate}</td>
                <td class="py-2 px-4">${item.dailyName}</td>
                <td class="py-2 px-4">${item.itemName}</td>
                <td class="py-2 px-4">${item.itemUnit}</td>
                <td class="py-2 px-4">${item.itemQuantity}</td>
                <td class="py-2 px-4">${formatCurrency(item.itemPrice)}</td>
                <td class="py-2 px-4">${item.itemDiscount}%</td>
                <td class="py-2 px-4">${formatCurrency(importPrice)}</td>
                <td class="py-2 px-4">${formatCurrency(totalItemAmount)}</td>
                ${index === 0 ? `<td class="py-2 px-4 font-bold" rowspan="${numItemsInReceipt}">${formatCurrency(receipt.totalReceiptAmount)}</td>` : ''}
            `;
        });
    }
    document.getElementById('grandTotalAllItems').textContent = formatCurrency(grandTotal);
}

// --- 3. Chức năng tìm kiếm và lọc ---

/**
 * Áp dụng các bộ lọc (tên đại lý/tên hàng và tháng) và cập nhật bảng hiển thị.
 */
function applyFilters() {
    const searchDailyNameInput = document.getElementById('searchDailyNameInput');
    const searchMonthInput = document.getElementById('searchMonth');

    const searchTerm = searchDailyNameInput ? normalizeString(searchDailyNameInput.value) : '';
    const searchMonth = searchMonthInput ? searchMonthInput.value : ''; // YYYY-MM

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

// --- 4. Xử lý Checkbox chọn tất cả ---

/**
 * Xử lý sự kiện khi checkbox "Chọn tất cả" thay đổi trạng thái.
 */
document.getElementById('selectAllReceipts')?.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.receipt-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

// --- 5. Xem chi tiết phiếu nhập ---

/**
 * Hiển thị chi tiết của phiếu nhập được chọn trong một cửa sổ SweetAlert2.
 */
document.getElementById('viewDetailsBtn')?.addEventListener('click', function() {
    const selectedReceiptKeys = new Set();
    document.querySelectorAll('.receipt-checkbox:checked').forEach(checkbox => {
        selectedReceiptKeys.add(checkbox.dataset.receiptKey);
    });

    if (selectedReceiptKeys.size === 0) {
        Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một phiếu nhập để xem chi tiết.', 'info');
        return;
    }

    if (selectedReceiptKeys.size > 1) {
        Swal.fire('Thông báo', 'Vui lòng chọn **chỉ một** phiếu nhập để xem chi tiết.', 'info');
        return;
    }

    const selectedKey = Array.from(selectedReceiptKeys)[0];
    const itemsInSelectedReceipt = allReceipts.filter(item => `${normalizeString(item.dailyName)}_${item.receiptDate}` === selectedKey);

    if (itemsInSelectedReceipt.length > 0) {
        let detailsHtml = `
            <p><strong>Đại lý:</strong> ${itemsInSelectedReceipt[0].dailyName}</p>
            <p><strong>Ngày:</strong> ${itemsInSelectedReceipt[0].receiptDate}</p>
            <h4 class="text-lg font-bold mt-3 mb-2">Chi tiết mặt hàng:</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="w-full text-left table-auto border-collapse">
                    <thead>
                        <tr>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">Tên hàng</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">ĐVT</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">SL</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">Đơn giá</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">CK(%)</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">Giá nhập</th>
                            <th class="border px-4 py-2 bg-gray-700 text-gray-300">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        let totalReceiptAmount = 0;
        itemsInSelectedReceipt.forEach(item => {
            const itemPrice = parseFloat(item.itemPrice) || 0;
            const itemDiscount = parseFloat(item.itemDiscount) || 0;
            const itemQuantity = parseFloat(item.itemQuantity) || 0;

            const importPrice = itemPrice * (1 - itemDiscount / 100);
            const totalItemAmount = importPrice * itemQuantity;
            totalReceiptAmount += totalItemAmount;
            detailsHtml += `
                <tr>
                    <td class="border px-4 py-2">${item.itemName}</td>
                    <td class="border px-4 py-2">${item.itemUnit}</td>
                    <td class="border px-4 py-2">${item.itemQuantity}</td>
                    <td class="border px-4 py-2">${formatCurrency(item.itemPrice)}</td>
                    <td class="border px-4 py-2">${item.itemDiscount}%</td>
                    <td class="border px-4 py-2">${formatCurrency(importPrice)}</td>
                    <td class="border px-4 py-2">${formatCurrency(totalItemAmount)}</td>
                </tr>
            `;
        });
        detailsHtml += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="border px-4 py-2 text-right font-bold bg-gray-700 text-gray-300">Tổng tiền phiếu:</td>
                            <td class="border px-4 py-2 font-bold bg-gray-700 text-green-400">${formatCurrency(totalReceiptAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        Swal.fire({
            title: 'Chi tiết phiếu nhập',
            html: detailsHtml,
            width: '90%',
            confirmButtonText: 'Đóng',
            customClass: {
                container: 'swal2-container-custom'
            }
        });
    }
});

// --- 6. Xóa các mục đã chọn ---

/**
 * Xóa các phiếu nhập đã chọn khỏi cơ sở dữ liệu thông qua API.
 */
document.getElementById('deleteSelectedBtn')?.addEventListener('click', async function() {
    const selectedReceiptKeys = new Set();
    document.querySelectorAll('.receipt-checkbox:checked').forEach(checkbox => {
        selectedReceiptKeys.add(checkbox.dataset.receiptKey);
    });

    if (selectedReceiptKeys.size === 0) {
        Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một phiếu nhập hoặc mặt hàng để xóa.', 'info');
        return;
    }

    Swal.fire({
        title: 'Bạn có chắc chắn muốn xóa?',
        text: "Các phiếu nhập đã chọn sẽ bị xóa vĩnh viễn! Hành động này không thể hoàn tác.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Có, xóa đi!',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            let successCount = 0;
            let errorCount = 0;

            for (const key of selectedReceiptKeys) {
                const parts = key.split('_');
                if (parts.length < 2) {
                    console.error("Lỗi định dạng key phiếu nhập:", key);
                    errorCount++;
                    continue;
                }
                const normalizedDailyNameFromKey = parts[0];
                const receiptDateFromKey = parts[1];

                try {
                    // Tìm item gốc trong allReceipts để lấy `dailyName` chính xác (không normalized)
                    const originalReceiptItem = allReceipts.find(item =>
                        normalizeString(item.dailyName) === normalizedDailyNameFromKey && item.receiptDate === receiptDateFromKey
                    );

                    if (!originalReceiptItem) {
                        console.warn(`Không tìm thấy phiếu nhập gốc cho key ${key} trong dữ liệu hiện tại.`);
                        errorCount++;
                        continue;
                    }
                    
                    const deleteUrl = `/api/nhaphang/${encodeURIComponent(originalReceiptItem.dailyName)}/${encodeURIComponent(receiptDateFromKey)}`;
                    console.log("Đang gửi yêu cầu DELETE tới:", deleteUrl);
                    
                    const response = await fetch(deleteUrl, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Xóa phiếu nhập cho key ${key} thất bại, status: ${response.status}, message: ${errorText}`);
                    }
                    console.log(`Đã xóa thành công phiếu nhập cho key: ${key}`);
                    successCount++;
                } catch (error) {
                    console.error(`Lỗi khi xóa phiếu nhập ${key}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                await loadReceipts(); // Tải lại dữ liệu sau khi xóa thành công
                Swal.fire('Hoàn tất!', `Đã xóa thành công ${successCount} phiếu nhập. ${errorCount > 0 ? `(${errorCount} phiếu nhập gặp lỗi)` : ''}`, 'success');
            } else {
                Swal.fire('Thất bại!', 'Không có phiếu nhập nào được xóa hoặc tất cả đều gặp lỗi.', 'error');
            }
        }
    });
});

// --- 7. Khởi tạo và các chức năng phụ trợ ---

/**
 * Hàm hiển thị ngày giờ hiện tại.
 */
function setupDateTicker() {
    const tickerWrap = document.getElementById('tickerWrap');
    if (tickerWrap) {
        setInterval(() => {
            const now = new Date();
            const dateString = now.toLocaleDateString('vi-VN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const timeString = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            tickerWrap.textContent = `Hôm nay là: ${dateString} - ${timeString}`;
        }, 1000);
    }
}

/**
 * Xử lý đăng xuất (chuyển hướng về trang đăng nhập).
 */
function logout() {
    Swal.fire({
        title: 'Xác nhận đăng xuất',
        text: 'Bạn có muốn đăng xuất khỏi hệ thống?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Có',
        cancelButtonText: 'Không'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/logout';
        }
    });
}

// Gắn sự kiện cho các nút và input khi DOM đã tải hoàn chỉnh
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo ngày/tháng hiện tại cho ô tìm kiếm tháng
    const searchMonthInput = document.getElementById('searchMonth');
    if (searchMonthInput) {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        searchMonthInput.value = currentMonth;
    }

    // Tải dữ liệu ban đầu từ server
    loadReceipts();

    // Gắn sự kiện cho nút tìm kiếm và các input lọc
    // Sử dụng ?. để đảm bảo phần tử tồn tại trước khi gắn sự kiện
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters); // Tìm kiếm khi gõ
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters); // Tìm kiếm khi thay đổi tháng

    // Bắt đầu ticker thời gian
    setupDateTicker();
});
