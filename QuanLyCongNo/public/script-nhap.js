document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const dailyNameInput = document.getElementById('dailyName');
    const receiptDateInput = document.getElementById('receiptDate');
    const itemNameInput = document.getElementById('itemName');
    const itemUnitInput = document.getElementById('itemUnit');
    const itemQuantityInput = document.getElementById('itemQuantity');
    const itemPriceInput = document.getElementById('itemPrice');
    const itemDiscountInput = document.getElementById('itemDiscount');
    const addItemBtn = document.getElementById('addItemBtn');
    const currentItemsBody = document.getElementById('currentItemsBody');
    const totalAmountSpan = document.getElementById('totalAmount'); // Tổng tiền cho phiếu đang tạo
    const saveReceiptBtn = document.getElementById('saveReceiptBtn');
    const searchDailyNameInput = document.getElementById('searchDailyName');
    const searchMonthInput = document.getElementById('searchMonth');
    const searchBtn = document.getElementById('searchBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const viewDetailsBtn = document.getElementById('viewDetailsBtn'); // Nút xem chi tiết mới
    const receiptsBody = document.getElementById('receiptsBody'); // Body của bảng "Mặt hàng đã nhập từ đại lý"
    const selectAllReceiptsCheckbox = document.getElementById('selectAllReceipts');
    const grandTotalAllItemsSpan = document.getElementById('grandTotalAllItems'); // Tổng tiền tất cả mặt hàng hiển thị

    const receiptsSectionCard = document.getElementById('receiptsSectionCard');

    let currentReceiptItems = []; // Array to hold items for the current receipt being built

    document.getElementById("btnBatDauNhap").addEventListener("click", () => {
  const formNhap = document.getElementById("formNhapHang");
  formNhap.classList.remove("hidden");
});
    // Hàm loại bỏ dấu tiếng Việt
    function removeVietnameseTones(str) {
        return str.normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .toLowerCase();
    }

    // --- Helper Functions (Now using SweetAlert2) ---

    /**
     * Shows a SweetAlert2 message box.
     * @param {string} title - The title of the message box.
     * @param {string} text - The main text message.
     * @param {string} icon - The icon type ('success', 'error', 'warning', 'info', 'question').
     * @param {string} confirmButtonText - Text for the confirm button.
     * @param {boolean} showCancelButton - Whether to show a cancel button.
     * @param {string} cancelButtonText - Text for the cancel button.
     * @returns {Promise<SweetAlertResult>} - SweetAlert2 result object.
     */
    async function showCustomAlert(title, text, icon, confirmButtonText = 'OK', showCancelButton = false, cancelButtonText = 'Hủy') {
        return Swal.fire({
            icon: icon,
            title: title,
            text: text,
            confirmButtonText: confirmButtonText,
            showCancelButton: showCancelButton,
            cancelButtonText: cancelButtonText,
            customClass: {
                popup: 'bg-gray-800 text-white rounded-lg shadow-lg',
                title: 'text-white',
                content: 'text-gray-300',
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                cancelButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2'
            },
            buttonsStyling: false // Disable default styling to use customClass
        });
    }

    /**
     * Formats a number as currency (Vietnamese Dong).
     * @param {number} amount - The number to format.
     * @returns {string} - Formatted currency string.
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    /**
     * Calculates Gia Nhap (Import Price) and Thanh Tien (Total for item).
     * @param {number} price - Don Gia (Unit Price).
     * @param {number} discount - Chiet Khau (Discount percentage).
     * @param {number} quantity - So Luong (Quantity).
     * @returns {{gianhap: number, thanhtien: number}}
     */
    function calculateItemTotals(price, discount, quantity) {
        const gianhap = price - (price * (discount / 100));
        const thanhtien = gianhap * quantity;
        return { gianhap, thanhtien };
    }

    /**
     * Renders items in the current receipt table.
     */
    function renderCurrentItems() {
        currentItemsBody.innerHTML = ''; // Clear existing rows
        let totalAmount = 0;

        currentReceiptItems.forEach((item, index) => {
            const row = currentItemsBody.insertRow();
            row.innerHTML = `
                <td class="py-2 px-4 border-b border-gray-700">${item.tenhang}</td>
                <td class="py-2 px-4 border-b border-gray-700">${item.dvt}</td>
                <td class="py-2 px-4 border-b border-gray-700">${item.soluong}</td>
                <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.dongia)}</td>
                <td class="py-2 px-4 border-b border-gray-700">${item.ck}%</td>
                <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.gianhap)}</td>
                <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.thanhtien)}</td>
                <td class="py-2 px-4 border-b border-gray-700">
                    <button class="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-xs remove-item-btn" data-index="${index}">Xóa</button>
                </td>
            `;
            totalAmount += item.thanhtien;
        });

        totalAmountSpan.textContent = formatCurrency(totalAmount);

        // Hiển thị hoặc ẩn toàn bộ khung nhập hàng
        const inputScrollWrapper = document.getElementById("inputScrollWrapper");
        const saveReceiptButton = document.getElementById("saveReceiptBtn");

        if (currentReceiptItems.length > 0) {
            inputScrollWrapper.classList.remove('hidden');
            saveReceiptButton.classList.remove('hidden');
        } else {
            inputScrollWrapper.classList.add('hidden');
            saveReceiptButton.classList.add('hidden');
        }
    }

    /**
     * Adds an item to the current receipt.
     */
    addItemBtn.addEventListener('click', async () => { // Made async to await Swal.fire
        const tenhang = itemNameInput.value.trim();
        const dvt = itemUnitInput.value.trim();
        const soluong = parseInt(itemQuantityInput.value);
        const dongia = parseFloat(itemPriceInput.value);
        const ck = parseFloat(itemDiscountInput.value);

        // --- VALIDATION FOR ADD ITEM BUTTON ---
        if (!tenhang) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng nhập tên hàng.', 'error');
            return;
        }
        if (!dvt) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng nhập đơn vị tính.', 'error');
            return;
        }
        if (isNaN(soluong) || soluong <= 0) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Số lượng phải là số và lớn hơn 0.', 'error');
            return;
        }
        if (isNaN(dongia) || dongia < 0) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Đơn giá phải là số và không âm.', 'error');
            return;
        }
        if (isNaN(ck) || ck < 0 || ck > 100) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Chiết khấu phải là số từ 0 đến 100.', 'error');
            return;
        }
        // --- END VALIDATION ---

        const { gianhap, thanhtien } = calculateItemTotals(dongia, ck, soluong);

        currentReceiptItems.push({
            tenhang,
            dvt,
            soluong,
            dongia,
            ck,
            gianhap,
            thanhtien
        });

        renderCurrentItems();

        // Clear item input fields
        itemNameInput.value = '';
        itemUnitInput.value = '';
        itemQuantityInput.value = '1';
        itemPriceInput.value = '0';
        itemDiscountInput.value = '0';
        itemNameInput.focus();
    });

    /**
     * Handles removing an item from the current receipt.
     */
    currentItemsBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const index = parseInt(event.target.dataset.index);
            currentReceiptItems.splice(index, 1); // Remove item from array
            renderCurrentItems(); // Re-render table
        }
    });

    /**
     * Saves the current receipt to the server.
     */
    saveReceiptBtn.addEventListener('click', async () => {
        const daily = dailyNameInput.value.trim();
        const ngay = receiptDateInput.value; // YYYY-MM-DD format

        // --- VALIDATION FOR SAVE RECEIPT BUTTON ---
        if (!daily) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng nhập tên đại lý.', 'error');
            return;
        }
        if (!ngay) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng chọn ngày nhập hàng.', 'error');
            return;
        }
        if (currentReceiptItems.length === 0) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập.', 'error');
            return;
        }
        // --- END VALIDATION ---

        const totalAmount = currentReceiptItems.reduce((sum, item) => sum + item.thanhtien, 0);

        try {
            const response = await fetch('/api/nhaphang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ngay,
                    daily,
                    items: currentReceiptItems,
                    tongtien: totalAmount
                })
            });

            if (response.ok) {
                await showCustomAlert('Thành công!', 'Phiếu nhập hàng đã được lưu thành công!', 'success');
                // Clear form and current items
                dailyNameInput.value = '';
                receiptDateInput.value = new Date().toISOString().split('T')[0]; // Reset to current date
                currentReceiptItems = [];
                renderCurrentItems();
                // Không gọi fetchAndRenderReceipts() ở đây để phần hiển thị vẫn ẩn
            } else if (response.status === 401) {
                await showCustomAlert('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                await showCustomAlert('Lỗi!', `Lỗi khi lưu phiếu nhập: ${errorData.error || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            await showCustomAlert('Lỗi kết nối!', 'Lỗi kết nối đến server. Vui lòng thử lại sau.', 'error');
        }
    });

    // ========== Hàm tải danh sách Đại Lý =============
     async function loadDailyNamesToSelect() {
    try {
        const res = await fetch('/api/nhaphang');
        if (!res.ok) throw new Error('Không lấy được danh sách phiếu nhập');
        const data = await res.json();

        const uniqueNames = [...new Set(data.map(r => r.daily).filter(Boolean))];
        const select = document.getElementById('dailyNameSelect');
        uniqueNames.sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách đại lý:', error);
    }
}
    // --- Sửa lại fetchAndRenderReceipts() để tìm kiếm không dấu ---
  /*  async function fetchAndRenderReceipts() {
        receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Đang tải dữ liệu...</td></tr>';
        const dailySearchRaw = searchDailyNameInput.value.trim();
        const dailySearch = removeVietnameseTones(dailySearchRaw);
        const monthSearch = searchMonthInput.value;

        if (!dailySearch && !monthSearch) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng nhập tên đại lý hoặc chọn tháng để tìm kiếm.', 'error');
            receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Vui lòng nhập tiêu chí tìm kiếm.</td></tr>';
            receiptsSectionCard.classList.add('hidden');
            grandTotalAllItemsSpan.textContent = '0 ₫'; // Reset total on no search criteria
            updateViewDetailsButtonState(); // Update button state
            return;
        }

        try {
            const response = await fetch('/api/nhaphang');
            if (!response.ok) {
                if (response.status === 401) {
                    await showCustomAlert('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                    setTimeout(() => window.location.href = '/index.html', 2000);
                    return;
                } else {
                    const errorData = await response.json();
                    throw new Error(`Lỗi khi tải dữ liệu: ${errorData.error || response.statusText}`);
                }
            }
            const receipts = await response.json();

            const filtered = receipts.filter(receipt => {
                const matchName = !dailySearch || removeVietnameseTones(receipt.daily || '').includes(dailySearch);
                const matchMonth = !monthSearch || (new Date(receipt.ngay)).toISOString().slice(0, 7) === monthSearch;
                return matchName && matchMonth;
            });

            receiptsBody.innerHTML = '';
            let grandTotal = 0;

            if (filtered.length === 0) {
                receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Không tìm thấy phiếu nhập nào.</td></tr>';
                grandTotalAllItemsSpan.textContent = '0 ₫';
                receiptsSectionCard.classList.add('hidden'); // Hide the section card if no results
                updateViewDetailsButtonState(); // Update button state
                return;
            }

            receiptsSectionCard.classList.remove('hidden'); // Show the section card if there are results

            filtered.forEach(receipt => {
                const receiptDate = new Date(receipt.ngay);
                const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                receipt.items.forEach((item) => {
                    const row = receiptsBody.insertRow();
                    row.dataset.receiptId = receipt._id;
                    row.dataset.itemId = item._id;

                    row.innerHTML = `
                        <td class="py-2 px-4 border-b border-gray-700 text-center">
                            <input type="checkbox" class="item-checkbox" data-receipt-id="${receipt._id}" data-item-id="${item._id}">
                        </td>
                        <td class="py-2 px-4 border-b border-gray-700">${formattedDate}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${receipt.daily}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${item.tenhang}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${item.dvt}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${item.soluong}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.dongia)}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${item.ck}%</td>
                        <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.gianhap)}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.thanhtien)}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(receipt.tongtien)}</td>
                    `;
                    grandTotal += item.thanhtien;
                });
            });

            grandTotalAllItemsSpan.textContent = formatCurrency(grandTotal);
            updateViewDetailsButtonState(); // Cập nhật trạng thái nút sau khi render thành công
        } catch (error) {
            console.error('Lỗi:', error);
            receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-red-500">Lỗi khi tải dữ liệu.</td></tr>';
            receiptsSectionCard.classList.add('hidden'); // Hide on error
            grandTotalAllItemsSpan.textContent = '0 ₫'; // Reset total on error
            updateViewDetailsButtonState(); // Update button state on error
        }
    }
*/
    // =========Chọn Đại Lý =============
    async function fetchAndRenderReceipts() {
    receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Đang tải dữ liệu...</td></tr>';

    const selectedDaily = document.getElementById('dailyNameSelect').value.trim();
    const monthSearch = searchMonthInput.value;

    if (!selectedDaily && !monthSearch) {
        await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng chọn tên đại lý hoặc tháng để tìm kiếm.', 'error');
        receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Vui lòng nhập tiêu chí tìm kiếm.</td></tr>';
        receiptsSectionCard.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');
        const receipts = await response.json();

        const filtered = receipts.filter(receipt => {
            const matchName = !selectedDaily || receipt.daily === selectedDaily;
            const matchMonth = !monthSearch || (new Date(receipt.ngay)).toISOString().slice(0, 7) === monthSearch;
            return matchName && matchMonth;
        });

        receiptsBody.innerHTML = '';
        let grandTotal = 0;

        if (filtered.length === 0) {
            receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Không tìm thấy phiếu nhập nào.</td></tr>';
            grandTotalAllItemsSpan.textContent = '0 ₫';
            receiptsSectionCard.classList.remove('hidden');
            return;
        }

        receiptsSectionCard.classList.remove('hidden');

        filtered.forEach(receipt => {
            const receiptDate = new Date(receipt.ngay);
            const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            receipt.items.forEach((item) => {
                const row = receiptsBody.insertRow();
                row.dataset.receiptId = receipt._id;
                row.dataset.itemId = item._id;

                row.innerHTML = `
                    <td class="py-2 px-4 border-b border-gray-700 text-center">
                        <input type="checkbox" class="item-checkbox" data-receipt-id="${receipt._id}" data-item-id="${item._id}">
                    </td>
                    <td class="py-2 px-4 border-b border-gray-700">${formattedDate}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${receipt.daily}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${item.tenhang}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${item.dvt}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${item.soluong}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.dongia)}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${item.ck}%</td>
                    <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.gianhap)}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(item.thanhtien)}</td>
                    <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(receipt.tongtien)}</td>
                `;
                grandTotal += item.thanhtien;
            });
        });

        grandTotalAllItemsSpan.textContent = formatCurrency(grandTotal);
        updateViewDetailsButtonState();
    } catch (error) {
        console.error('Lỗi:', error);
        receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-red-500">Lỗi khi tải dữ liệu.</td></tr>';
    }
}
    // Event listener for search button
    searchBtn.addEventListener('click', fetchAndRenderReceipts);

    // Function to update the state of the "View Details" button
    function updateViewDetailsButtonState() {
        const checkedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
        if (checkedCheckboxes.length > 0) {
            viewDetailsBtn.disabled = false;
        } else {
            viewDetailsBtn.disabled = true;
        }
    }

    // Event listener for any item checkbox change
    receiptsBody.addEventListener('change', (event) => {
        if (event.target.classList.contains('item-checkbox')) {
            updateViewDetailsButtonState(); // Update button state after any checkbox changes
            if (!event.target.checked) {
                selectAllReceiptsCheckbox.checked = false;
            } else {
                const allItemCheckboxes = document.querySelectorAll('.item-checkbox');
                const allChecked = Array.from(allItemCheckboxes).every(cb => cb.checked);
                selectAllReceiptsCheckbox.checked = allChecked;
            }
        }
    });

    // Event listener for select all checkbox
    selectAllReceiptsCheckbox.addEventListener('change', (event) => {
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
        updateViewDetailsButtonState(); // Update button state after select all
    });

    /**
     * Deletes selected items from receipts.
     */
    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedItemsToDelete = [];
        document.querySelectorAll('.item-checkbox:checked').forEach(checkbox => {
            selectedItemsToDelete.push({
                receiptId: checkbox.dataset.receiptId,
                itemId: checkbox.dataset.itemId
            });
        });

        // --- VALIDATION FOR DELETE SELECTED BUTTON ---
        if (selectedItemsToDelete.length === 0) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng chọn ít nhất một món hàng để xóa.', 'error');
            return;
        }
        // --- END VALIDATION ---

        const result = await showCustomAlert('Xác nhận hành động', 'Bạn có chắc chắn muốn xóa các món hàng đã chọn?', 'warning', 'Xác nhận', true, 'Hủy');
        if (!result.isConfirmed) {
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const itemInfo of selectedItemsToDelete) {
            try {
                const response = await fetch('/api/nhaphang/item', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemInfo)
                });

                if (response.ok) {
                    successCount++;
                } else if (response.status === 401) {
                    await showCustomAlert('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                    setTimeout(() => window.location.href = '/index.html', 2000);
                    return; // Exit loop and function if session expires
                } else {
                    failCount++;
                    const errorData = await response.json();
                    console.error(`Lỗi khi xóa món hàng ${itemInfo.itemId} từ phiếu ${itemInfo.receiptId}:`, errorData.error || response.statusText);
                }
            } catch (error) {
                failCount++;
                console.error(`Lỗi mạng hoặc server khi xóa món hàng ${itemInfo.itemId} từ phiếu ${itemInfo.receiptId}:`, error);
            }
        }

        await showCustomAlert('Thông báo!', `Đã xóa thành công ${successCount} món hàng. Thất bại: ${failCount} món hàng.`, 'info');
        selectAllReceiptsCheckbox.checked = false; // Uncheck select all after deletion
        await fetchAndRenderReceipts(); // Re-render receipts to show updated list
    });

    // --- View Details Button Logic ---
    viewDetailsBtn.addEventListener('click', async () => {
        const checkedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
        // --- VALIDATION FOR VIEW DETAILS BUTTON ---
        if (checkedCheckboxes.length === 0) {
            await showCustomAlert('Thiếu hoặc sai thông tin!', 'Vui lòng chọn ít nhất một món hàng để xem chi tiết.', 'error');
            return;
        }
        // --- END VALIDATION ---

        // Lấy receiptId của món hàng được chọn đầu tiên để xem chi tiết phiếu nhập
        const firstCheckedReceiptId = checkedCheckboxes[0].dataset.receiptId;

        try {
            const response = await fetch(`/api/nhaphang/${firstCheckedReceiptId}`);
            if (response.ok) {
                const receipt = await response.json();
                const dailyName = receipt.daily;
                const receiptDate = new Date(receipt.ngay).toISOString().split('T')[0];

                window.open(`/print-receipt?daily=${encodeURIComponent(dailyName)}&date=${receiptDate}`, '_blank');
            } else if (response.status === 401) {
                await showCustomAlert('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                await showCustomAlert('Lỗi!', `Lỗi khi lấy chi tiết phiếu nhập để in: ${errorData.error || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server khi lấy chi tiết phiếu nhập để in:', error);
            await showCustomAlert('Lỗi kết nối!', 'Lỗi kết nối đến server. Vui lòng thử lại sau.', 'error');
        }
    });

    // --- Date Ticker Logic (from existing style.css) ---
    const dateTicker = document.getElementById('dateTicker');
    const tickerWrap = document.getElementById('tickerWrap');

    function updateDateTicker() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const formattedDate = now.toLocaleDateString('vi-VN', options);
        tickerWrap.textContent = formattedDate;
    }

    function animateTicker() {
        const tickerWidth = tickerWrap.offsetWidth;
        const containerWidth = dateTicker.offsetWidth;

        if (tickerWidth > containerWidth) {
            let position = containerWidth;
            function frame() {
                position--;
                if (position < -tickerWidth) {
                    position = containerWidth;
                }
                tickerWrap.style.transform = `translateX(${position}px)`;
                requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        } else {
            tickerWrap.style.transform = `translateX(${(containerWidth - tickerWidth) / 2}px)`;
        }
    }

    // --- Initial Load ---
    async function init() {
        // Set current date for the receiptDate input
        receiptDateInput.value = new Date().toISOString().split('T')[0];

        // Check user session
        try {
            const sessionCheck = await fetch('/session-check');
            if (!sessionCheck.ok) {
                await showCustomAlert('Lỗi!', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            await showCustomAlert('Lỗi kết nối!', 'Lỗi kết nối đến server. Vui lòng kiểm tra mạng và thử lại.', 'error');
        }
        await loadDailyNamesToSelect(); // ✅ GỌI loaddata NGAY TRONG INIT
        updateDateTicker();
        animateTicker();
        setInterval(updateDateTicker, 1000); // Update every second

        // Đảm bảo phần hiển thị các phiếu nhập từ đại lý ẩn đi ban đầu
        receiptsSectionCard.classList.add('hidden');
        grandTotalAllItemsSpan.textContent = '0 ₫';
        updateViewDetailsButtonState(); // Đảm bảo nút xem chi tiết bị vô hiệu hóa khi chưa có gì được tải
    }

    init(); // Call initialization function

    // --- Logout Function ---
    window.logout = async function() {
        try {
            const response = await fetch('/logout');
            if (response.ok) {
                window.location.href = '/index.html';
            } else {
                await showCustomAlert('Lỗi!', 'Đăng xuất thất bại.', 'error');
            }
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            await showCustomAlert('Lỗi kết nối!', 'Lỗi kết nối. Không thể đăng xuất.', 'error');
        }
    };
});
