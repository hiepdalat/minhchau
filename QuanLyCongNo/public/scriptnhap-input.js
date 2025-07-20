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
            // Nếu không được xác thực, chuyển hướng về trang đăng nhập
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
@@ -79,9 +81,7 @@
    // Nhóm các mặt hàng theo phiếu nhập để tính tổng tiền phiếu và hiển thị gộp hàng
    const receiptsGrouped = {};
    receiptsToDisplay.forEach(item => {
        // Sử dụng dailyName và receiptDate để tạo key cho phiếu nhập
        // Key này sẽ được dùng để nhóm các mặt hàng thuộc cùng một phiếu
        const receiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`;
        const receiptKey = `${normalizeString(item.dailyName)}_${item.receiptDate}`; // Key duy nhất cho mỗi phiếu
        if (!receiptsGrouped[receiptKey]) {
            receiptsGrouped[receiptKey] = {
                dailyName: item.dailyName,
@@ -97,7 +97,6 @@
    for (const key in receiptsGrouped) {
        let currentReceiptTotal = 0;
        receiptsGrouped[key].items.forEach(item => {
            // Đảm bảo các giá trị là số trước khi tính toán
            const itemPrice = parseFloat(item.itemPrice) || 0;
            const itemDiscount = parseFloat(item.itemDiscount) || 0;
            const itemQuantity = parseFloat(item.itemQuantity) || 0;
@@ -116,16 +115,16 @@

        receipt.items.forEach((item, index) => {
            const row = receiptsBody.insertRow();
            row.dataset.itemId = item.id; // ID của mặt hàng riêng lẻ (từ MongoDB _id)
            row.dataset.receiptKey = key; // Key của phiếu nhập chứa mặt hàng này
            row.dataset.itemId = item.id;
            row.dataset.receiptKey = key;

            const itemPrice = parseFloat(item.itemPrice) || 0;
            const itemDiscount = parseFloat(item.itemDiscount) || 0;
            const itemQuantity = parseFloat(item.itemQuantity) || 0;

            const importPrice = itemPrice * (1 - itemDiscount / 100);
            const totalItemAmount = importPrice * itemQuantity;
            grandTotal += totalItemAmount; // Tổng tiền của tất cả mặt hàng hiển thị
            grandTotal += totalItemAmount;

            row.innerHTML = `
                <td class="py-2 px-4"><input type="checkbox" class="receipt-checkbox" data-receipt-key="${key}"></td>
@@ -157,14 +156,15 @@
    const searchTerm = searchDailyNameInput ? normalizeString(searchDailyNameInput.value) : '';
    const searchMonth = searchMonthInput ? searchMonthInput.value : ''; // YYYY-MM

    console.log(`applyFilters: searchTerm='${searchTerm}', searchMonth='${searchMonth}'`);
    console.log(`allReceipts length before filter: ${allReceipts.length}`);

    const filteredReceipts = allReceipts.filter(item => {
        const normalizedDailyName = normalizeString(item.dailyName);
        const normalizedItemName = normalizeString(item.itemName);

        // Lọc theo tên đại lý hoặc tên hàng (không dấu, không phân biệt chữ hoa/thường)
        const matchesName = searchTerm === '' || normalizedDailyName.includes(searchTerm) || normalizedItemName.includes(searchTerm);

        // Lọc theo tháng
        let matchesMonth = true;
        if (searchMonth) {
            const itemMonth = item.receiptDate ? item.receiptDate.substring(0, 7) : '';
@@ -173,6 +173,7 @@
        return matchesName && matchesMonth;
    });

    console.log(`filteredReceipts length: ${filteredReceipts.length}`);
    renderReceiptsTable(filteredReceipts);
}

@@ -308,10 +309,9 @@
            let errorCount = 0;

            for (const key of selectedReceiptKeys) {
                // Tách dailyName và receiptDate từ key
                const parts = key.split('_');
                if (parts.length < 2) {
                    console.error("Invalid receipt key format:", key);
                    console.error("Lỗi định dạng key phiếu nhập:", key);
                    errorCount++;
                    continue;
                }
@@ -325,21 +325,23 @@
                    );

                    if (!originalReceiptItem) {
                        console.warn(`Original receipt for key ${key} not found in current data.`);
                        console.warn(`Không tìm thấy phiếu nhập gốc cho key ${key} trong dữ liệu hiện tại.`);
                        errorCount++;
                        continue;
                    }

                    // Sử dụng dailyName và receiptDate gốc để gửi yêu cầu DELETE
                    const deleteUrl = `/api/nhaphang/${encodeURIComponent(originalReceiptItem.dailyName)}/${encodeURIComponent(receiptDateFromKey)}`;
                    console.log("Đang gửi yêu cầu DELETE tới:", deleteUrl);

                    const response = await fetch(deleteUrl, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to delete receipt for key ${key}, status: ${response.status}`);
                        const errorText = await response.text();
                        throw new Error(`Xóa phiếu nhập cho key ${key} thất bại, status: ${response.status}, message: ${errorText}`);
                    }
                    console.log(`Đã xóa thành công phiếu nhập cho key: ${key}`);
                    successCount++;
                } catch (error) {
                    console.error(`Lỗi khi xóa phiếu nhập ${key}:`, error);
@@ -351,7 +353,7 @@
                await loadReceipts(); // Tải lại dữ liệu sau khi xóa thành công
                Swal.fire('Hoàn tất!', `Đã xóa thành công ${successCount} phiếu nhập. ${errorCount > 0 ? `(${errorCount} phiếu nhập gặp lỗi)` : ''}`, 'success');
            } else {
                Swal.fire('Thất bại!', 'Không có phiếu nhập nào được xóa. Vui lòng kiểm tra lại.', 'error');
                Swal.fire('Thất bại!', 'Không có phiếu nhập nào được xóa hoặc tất cả đều gặp lỗi.', 'error');
            }
        }
    });
@@ -393,7 +395,6 @@
        cancelButtonText: 'Không'
    }).then((result) => {
        if (result.isConfirmed) {
            // Chuyển hướng đến endpoint logout của server
            window.location.href = '/logout';
        }
    });
@@ -413,9 +414,10 @@
    loadReceipts();

    // Gắn sự kiện cho nút tìm kiếm và các input lọc
    // Sử dụng ?. để đảm bảo phần tử tồn tại trước khi gắn sự kiện
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters); // Tìm kiếm khi gõ
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters); // Tìm kiếm khi thay đổi tháng

    // Bắt đầu ticker thời gian
    setupDateTicker();
