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
    const totalAmountSpan = document.getElementById('totalAmount');
    const saveReceiptBtn = document.getElementById('saveReceiptBtn');
    const searchDailyNameInput = document.getElementById('searchDailyName');
    const searchMonthInput = document.getElementById('searchMonth');
    const searchBtn = document.getElementById('searchBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const receiptsBody = document.getElementById('receiptsBody');
    const selectAllReceiptsCheckbox = document.getElementById('selectAllReceipts');
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

    let currentReceiptItems = []; // Array to hold items for the current receipt being built

    // --- Helper Functions ---

    /**
     * Shows a custom message box instead of alert().
     * @param {string} message - The message to display.
     */
    function showMessageBox(message) {
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
    }

    // Event listener for message box close button
    messageBoxCloseBtn.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

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
    }

    /**
     * Adds an item to the current receipt.
     */
    addItemBtn.addEventListener('click', () => {
        const tenhang = itemNameInput.value.trim();
        const dvt = itemUnitInput.value.trim();
        const soluong = parseInt(itemQuantityInput.value);
        const dongia = parseFloat(itemPriceInput.value);
        const ck = parseFloat(itemDiscountInput.value);

        if (!tenhang || !dvt || isNaN(soluong) || soluong <= 0 || isNaN(dongia) || dongia < 0 || isNaN(ck) || ck < 0 || ck > 100) {
            showMessageBox('Vui lòng nhập đầy đủ và hợp lệ thông tin mặt hàng (Số lượng > 0, Đơn giá >= 0, CK từ 0-100).');
            return;
        }

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

        if (!daily) {
            showMessageBox('Vui lòng nhập tên đại lý.');
            return;
        }
        if (!ngay) {
            showMessageBox('Vui lòng chọn ngày nhập hàng.');
            return;
        }
        if (currentReceiptItems.length === 0) {
            showMessageBox('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập.');
            return;
        }

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
                showMessageBox('Phiếu nhập hàng đã được lưu thành công!');
                // Clear form and current items
                dailyNameInput.value = '';
                receiptDateInput.value = new Date().toISOString().split('T')[0]; // Reset to current date
                currentReceiptItems = [];
                renderCurrentItems();
                await fetchAndRenderReceipts(); // Refresh the list of saved receipts
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                showMessageBox(`Lỗi khi lưu phiếu nhập: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            showMessageBox('Lỗi kết nối đến server. Vui lòng thử lại sau.');
        }
    });

    /**
     * Fetches and renders saved receipts.
     */
    async function fetchAndRenderReceipts() {
        receiptsBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Đang tải dữ liệu...</td></tr>';
        const dailySearch = searchDailyNameInput.value.trim();
        const monthSearch = searchMonthInput.value; // YYYY-MM format

        let url = '/api/nhaphang?';
        if (dailySearch) {
            url += `daily=${encodeURIComponent(dailySearch)}&`;
        }
        if (monthSearch) {
            url += `month=${encodeURIComponent(monthSearch)}&`;
        }
        url = url.slice(0, -1); // Remove trailing '&' or '?'

        try {
            const response = await fetch(url);
            if (response.ok) {
                const receipts = await response.json();
                receiptsBody.innerHTML = ''; // Clear loading message

                if (receipts.length === 0) {
                    receiptsBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Không tìm thấy phiếu nhập nào.</td></tr>';
                    return;
                }

                receipts.forEach(receipt => {
                    const row = receiptsBody.insertRow();
                    row.dataset.id = receipt._id; // Store receipt ID for deletion

                    // Format date to dd/mm/yyyy
                    const receiptDate = new Date(receipt.ngay);
                    const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });

                    row.innerHTML = `
                        <td class="py-2 px-4 border-b border-gray-700 text-center"><input type="checkbox" class="receipt-checkbox" data-id="${receipt._id}"></td>
                        <td class="py-2 px-4 border-b border-gray-700">${formattedDate}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${receipt.daily}</td>
                        <td class="py-2 px-4 border-b border-gray-700">${formatCurrency(receipt.tongtien)}</td>
                        <td class="py-2 px-4 border-b border-gray-700">
                            <button class="bg-indigo-500 hover:bg-indigo-700 text-white py-1 px-2 rounded text-xs view-details-btn" data-id="${receipt._id}">Xem</button>
                        </td>
                    `;
                });
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                receiptsBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-400">Lỗi: ${errorData.error || response.statusText}</td></tr>`;
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            receiptsBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-400">Lỗi kết nối đến server.</td></tr>`;
        }
    }

    // Event listener for search button
    searchBtn.addEventListener('click', fetchAndRenderReceipts);

    // Event listener for select all checkbox
    selectAllReceiptsCheckbox.addEventListener('change', (event) => {
        document.querySelectorAll('.receipt-checkbox').forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
    });

    /**
     * Deletes selected receipts.
     */
    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.receipt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id);

        if (selectedIds.length === 0) {
            showMessageBox('Vui lòng chọn ít nhất một phiếu nhập để xóa.');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa các phiếu nhập đã chọn?')) { // Using confirm for simplicity, but a custom modal is better
            return;
        }

        try {
            const response = await fetch('/api/nhaphang', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                const result = await response.json();
                showMessageBox(result.message);
                selectAllReceiptsCheckbox.checked = false; // Uncheck select all
                await fetchAndRenderReceipts(); // Refresh the list
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                showMessageBox(`Lỗi khi xóa phiếu nhập: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            showMessageBox('Lỗi kết nối đến server. Vui lòng thử lại sau.');
        }
    });

    /**
     * Handles viewing details of a receipt (placeholder for now).
     */
    receiptsBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('view-details-btn')) {
            const receiptId = event.target.dataset.id;
            // In a real application, you would fetch details for this ID
            // and display them in a modal or navigate to a detail page.
            showMessageBox(`Xem chi tiết phiếu nhập ID: ${receiptId}\n(Chức năng này sẽ được phát triển thêm để hiển thị chi tiết các mặt hàng trong phiếu)`);
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
                window.location.href = '/index.html'; // Redirect to login if session is invalid
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = '/index.html'; // Redirect on network error
        }

        updateDateTicker();
        animateTicker();
        setInterval(updateDateTicker, 1000); // Update every second

        await fetchAndRenderReceipts(); // Load initial receipts
    }

    init(); // Call initialization function

    // --- Logout Function ---
    window.logout = async function() {
        try {
            const response = await fetch('/logout');
            if (response.ok) {
                window.location.href = '/index.html';
            } else {
                showMessageBox('Đăng xuất thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            showMessageBox('Lỗi kết nối. Không thể đăng xuất.');
        }
    };
});
