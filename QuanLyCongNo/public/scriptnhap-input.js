// scriptnhap-input.js

// --- 1. Hàm tiện ích và quản lý Local Storage ---

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
    // Đảm bảo amount là một số hợp lệ, nếu không thì mặc định là 0
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
}

/**
 * Lưu danh sách phiếu nhập vào Local Storage.
 * @param {Array<Object>} receipts - Mảng các đối tượng phiếu nhập.
 */
function saveReceipts(receipts) {
    try {
        localStorage.setItem('importReceipts', JSON.stringify(receipts));
    } catch (e) {
        console.error("Lỗi khi lưu dữ liệu vào Local Storage:", e);
        Swal.fire('Lỗi!', 'Không thể lưu dữ liệu. Vui lòng kiểm tra bộ nhớ trình duyệt.', 'error');
    }
}

/**
 * Tải danh sách phiếu nhập từ Local Storage.
 * @returns {Array<Object>} Mảng các đối tượng phiếu nhập hoặc mảng rỗng nếu không có dữ liệu.
 */
function loadReceipts() {
    try {
        const receiptsJSON = localStorage.getItem('importReceipts');
        return receiptsJSON ? JSON.parse(receiptsJSON) : [];
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu từ Local Storage:", e);
        Swal.fire('Lỗi!', 'Không thể tải dữ liệu. Dữ liệu có thể bị hỏng.', 'error');
        return [];
    }
}

// Biến toàn cục để lưu trữ tất cả các phiếu nhập
let allReceipts = loadReceipts();

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
        // Tạo một ID duy nhất cho mỗi mặt hàng nếu chưa có (để dễ dàng xóa từng mặt hàng nếu cần)
        if (!item.id) {
            item.id = Date.now() + Math.random().toString(36).substring(2, 9);
        }
        const receiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`; // Key duy nhất cho mỗi phiếu
        if (!receiptsGrouped[receiptKey]) {
            receiptsGrouped[receiptKey] = {
                dailyName: item.dailyName,
                receiptDate: item.receiptDate,
                items: [],
                totalReceiptAmount: 0 // Tổng tiền cho phiếu này
            };
        }
        receiptsGrouped[receiptKey].items.push(item);
    });

    // Tính toán tổng tiền cho từng phiếu nhập đã nhóm
    for (const key in receiptsGrouped) {
        let currentReceiptTotal = 0;
        receiptsGrouped[key].items.forEach(item => {
            const importPrice = item.itemPrice * (1 - item.itemDiscount / 100);
            const totalItemAmount = importPrice * item.itemQuantity;
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
            // Store unique item ID and the group key
            row.dataset.itemId = item.id;
            row.dataset.receiptKey = key;

            const importPrice = item.itemPrice * (1 - item.itemDiscount / 100);
            const totalItemAmount = importPrice * item.itemQuantity;
            grandTotal += totalItemAmount; // Tổng tiền của tất cả mặt hàng hiển thị

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

    // Kiểm tra xem các phần tử tồn tại trước khi truy cập .value
    const searchTerm = searchDailyNameInput ? normalizeString(searchDailyNameInput.value) : '';
    const searchMonth = searchMonthInput ? searchMonthInput.value : ''; // YYYY-MM

    const filteredReceipts = allReceipts.filter(item => {
        const normalizedDailyName = normalizeString(item.dailyName);
        const normalizedItemName = normalizeString(item.itemName);

        // Lọc theo tên đại lý hoặc tên hàng (không dấu, không phân biệt chữ hoa/thường)
        const matchesName = searchTerm === '' || normalizedDailyName.includes(searchTerm) || normalizedItemName.includes(searchTerm);

        // Lọc theo tháng
        let matchesMonth = true;
        if (searchMonth) {
            // Lấy phần YYYY-MM từ ngày của mặt hàng
            const itemMonth = item.receiptDate ? item.receiptDate.substring(0, 7) : '';
            matchesMonth = itemMonth === searchMonth;
        }
        return matchesName && matchesMonth;
    });

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
            const importPrice = item.itemPrice * (1 - item.itemDiscount / 100);
            const totalItemAmount = importPrice * item.itemQuantity;
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
            width: '90%', // Chiều rộng lớn hơn để hiển thị bảng tốt hơn
            confirmButtonText: 'Đóng',
            customClass: {
                container: 'swal2-container-custom' // Add a custom class for potential custom styling
            }
        });
    }
});

// --- 6. Xóa các mục đã chọn ---

/**
 * Xóa các phiếu nhập đã chọn khỏi danh sách và cập nhật Local Storage.
 */
document.getElementById('deleteSelectedBtn')?.addEventListener('click', function() {
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
    }).then((result) => {
        if (result.isConfirmed) {
            let initialReceiptCount = allReceipts.length;
            // Lọc ra các mặt hàng không thuộc bất kỳ phiếu nhập nào đã chọn
            allReceipts = allReceipts.filter(item => {
                const itemReceiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`;
                return !selectedReceiptKeys.has(itemReceiptKey);
            });

            if (allReceipts.length < initialReceiptCount) {
                saveReceipts(allReceipts); // Lưu lại dữ liệu sau khi xóa
                applyFilters(); // Render lại bảng để cập nhật dữ liệu
                Swal.fire('Đã xóa!', 'Các phiếu nhập đã chọn đã được xóa.', 'success');
            } else {
                Swal.fire('Thông báo', 'Không có phiếu nhập nào được xóa.', 'info');
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
            // Thực hiện các bước đăng xuất cần thiết (ví dụ: xóa token, session)
            window.location.href = 'login.html'; // Thay thế bằng URL trang đăng nhập thực tế của bạn
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

    applyFilters(); // Hiển thị tất cả dữ liệu ban đầu khi tải trang

    // Gắn sự kiện cho nút tìm kiếm và các input lọc
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters);

    // Bắt đầu ticker thời gian
    setupDateTicker();
});
