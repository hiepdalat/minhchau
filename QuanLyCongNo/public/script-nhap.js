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

    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');
    const messageBoxContent = messageBox.querySelector('.bg-gray-800'); // Lấy nội dung của modal
    const receiptsSectionCard = document.getElementById('receiptsSectionCard');

    let currentReceiptItems = []; // Array to hold items for the current receipt being built

    // --- Helper Functions ---

    /**
     * Shows a custom message box.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('error', 'success', 'info').
     * @param {boolean} isConfirmation - True if this is a confirmation dialog, false for simple message.
     */
    function showMessageBox(message, type = 'info', isConfirmation = false) {
        messageText.innerHTML = ''; // Clear previous content
        messageBoxContent.className = 'bg-gray-800 p-6 rounded-lg shadow-lg text-white max-w-sm w-full text-center'; // Reset classes

        let iconHtml = '';
        let titleClass = '';

        switch (type) {
            case 'error':
                iconHtml = '<i class="fas fa-times-circle text-red-500 text-3xl mb-2"></i>';
                titleClass = 'text-red-400';
                break;
            case 'success':
                iconHtml = '<i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>';
                titleClass = 'text-green-400';
                break;
            case 'info':
            default:
                iconHtml = '<i class="fas fa-exclamation-circle text-yellow-500 text-3xl mb-2"></i>';
                titleClass = 'text-yellow-400';
                break;
        }

        messageText.innerHTML = `${iconHtml}<p class="text-lg font-bold ${titleClass}">${message}</p>`;
        messageBox.classList.remove('hidden');

        let confirmBtn = messageBox.querySelector('#messageBoxConfirmBtn');
        if (isConfirmation) {
            if (!confirmBtn) {
                confirmBtn = document.createElement('button');
                confirmBtn.id = 'messageBoxConfirmBtn';
                confirmBtn.textContent = 'Xác nhận';
                confirmBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2';
                messageBox.querySelector('.bg-gray-800').appendChild(confirmBtn);
            } else {
                confirmBtn.classList.remove('hidden');
            }
            messageBoxCloseBtn.textContent = 'Hủy';
            messageBoxCloseBtn.classList.remove('hidden');
        } else {
            if (confirmBtn) confirmBtn.classList.add('hidden');
            messageBoxCloseBtn.textContent = 'Đóng';
            messageBoxCloseBtn.classList.remove('hidden');
        }
    }

    /**
     * Shows a custom confirmation dialog.
     * @param {string} message - The confirmation message.
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false otherwise.
     */
    function showConfirmationBox(message) {
        return new Promise(resolve => {
            showMessageBox(message, 'info', true); // Use info type for confirmation

            const confirmBtn = messageBox.querySelector('#messageBoxConfirmBtn');
            const handleConfirm = () => {
                messageBox.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                messageBoxCloseBtn.removeEventListener('click', handleCancel);
                resolve(true);
            };

            const handleCancel = () => {
                messageBox.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                messageBoxCloseBtn.removeEventListener('click', handleCancel);
                resolve(false);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            messageBoxCloseBtn.addEventListener('click', handleCancel);
        });
    }

    // Event listener for message box close button (for simple messages)
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

        if (!tenhang) {
            showMessageBox('Vui lòng nhập tên hàng.', 'error');
            return;
        }
        if (!dvt) {
            showMessageBox('Vui lòng nhập đơn vị tính.', 'error');
            return;
        }
        if (isNaN(soluong) || soluong <= 0) {
            showMessageBox('Số lượng phải là số và lớn hơn 0.', 'error');
            return;
        }
        if (isNaN(dongia) || dongia < 0) {
            showMessageBox('Đơn giá phải là số và không âm.', 'error');
            return;
        }
        if (isNaN(ck) || ck < 0 || ck > 100) {
            showMessageBox('Chiết khấu phải là số từ 0 đến 100.', 'error');
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
            showMessageBox('Vui lòng nhập tên đại lý.', 'error');
            return;
        }
        if (!ngay) {
            showMessageBox('Vui lòng chọn ngày nhập hàng.', 'error');
            return;
        }
        if (currentReceiptItems.length === 0) {
            showMessageBox('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập.', 'error');
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
                showMessageBox('Phiếu nhập hàng đã được lưu thành công!', 'success');
                // Clear form and current items
                dailyNameInput.value = '';
                receiptDateInput.value = new Date().toISOString().split('T')[0]; // Reset to current date
                currentReceiptItems = [];
                renderCurrentItems();
                // Không gọi fetchAndRenderReceipts() ở đây để phần hiển thị vẫn ẩn
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                showMessageBox(`Lỗi khi lưu phiếu nhập: ${errorData.error || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            showMessageBox('Lỗi kết nối đến server. Vui lòng thử lại sau.', 'error');
        }
    });

    /**
     * Fetches and renders saved receipts as a flattened list of items.
     */
    async function fetchAndRenderReceipts() {
        receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Đang tải dữ liệu...</td></tr>';
        const dailySearch = searchDailyNameInput.value.trim();
        const monthSearch = searchMonthInput.value; // YYYY-MM format

        if (!dailySearch && !monthSearch) {
            showMessageBox('Vui lòng nhập tên đại lý hoặc chọn tháng để tìm kiếm.', 'error');
            receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Vui lòng nhập tiêu chí tìm kiếm.</td></tr>';
            receiptsSectionCard.classList.add('hidden'); // Ẩn lại nếu không có tiêu chí
            return;
        }

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
                let grandTotal = 0;

                // Hiển thị phần hiển thị phiếu nhập khi dữ liệu được tải thành công
                receiptsSectionCard.classList.remove('hidden');

                if (receipts.length === 0) {
                    receiptsBody.innerHTML = '<tr><td colspan="11" class="text-center py-4">Không tìm thấy phiếu nhập nào.</td></tr>';
                    grandTotalAllItemsSpan.textContent = formatCurrency(0);
                    return;
                }

                receipts.forEach(receipt => {
                    const receiptDate = new Date(receipt.ngay);
                    const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });

                    receipt.items.forEach((item) => { // item now has an _id
                        const row = receiptsBody.insertRow();
                        // Store both receipt ID and item ID for deletion
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

                updateViewDetailsButtonState(); // Cập nhật trạng thái nút sau khi render
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                receiptsBody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-red-400">Lỗi: ${errorData.error || response.statusText}</td></tr>`;
                grandTotalAllItemsSpan.textContent = formatCurrency(0);
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server:', error);
            receiptsBody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-red-400">Lỗi kết nối đến server.</td></tr>`;
            grandTotalAllItemsSpan.textContent = formatCurrency(0);
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

        if (selectedItemsToDelete.length === 0) {
            showMessageBox('Vui lòng chọn ít nhất một món hàng để xóa.', 'error');
            return;
        }

        const confirmed = await showConfirmationBox('Bạn có chắc chắn muốn xóa các món hàng đã chọn?');
        if (!confirmed) {
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
                    showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                    setTimeout(() => window.location.href = '/index.html', 2000);
                    return;
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

        showMessageBox(`Đã xóa thành công ${successCount} món hàng. Thất bại: ${failCount} món hàng.`, 'info');
        selectAllReceiptsCheckbox.checked = false;
        await fetchAndRenderReceipts();
    });

    // --- View Details Button Logic ---
    viewDetailsBtn.addEventListener('click', async () => {
        const checkedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
        if (checkedCheckboxes.length === 0) {
            showMessageBox('Vui lòng chọn ít nhất một món hàng để xem chi tiết.', 'error');
            return;
        }

        const firstCheckedReceiptId = checkedCheckboxes[0].dataset.receiptId;

        try {
            const response = await fetch(`/api/nhaphang/${firstCheckedReceiptId}`);
            if (response.ok) {
                const receipt = await response.json();
                const dailyName = receipt.daily;
                const receiptDate = new Date(receipt.ngay).toISOString().split('T')[0];

                window.open(`/print-receipt?daily=${encodeURIComponent(dailyName)}&date=${receiptDate}`, '_blank');
            } else if (response.status === 401) {
                showMessageBox('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                setTimeout(() => window.location.href = '/index.html', 2000);
            } else {
                const errorData = await response.json();
                showMessageBox(`Lỗi khi lấy chi tiết phiếu nhập để in: ${errorData.error || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server khi lấy chi tiết phiếu nhập để in:', error);
            showMessageBox('Lỗi kết nối đến server. Vui lòng thử lại sau.', 'error');
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
            showMessageBox('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.', 'error');
            // window.location.href = '/index.html'; // Redirect on network error
        }

        updateDateTicker();
        animateTicker();
        setInterval(updateDateTicker, 1000); // Update every second

        // Không gọi fetchAndRenderReceipts() ở đây để phần hiển thị ẩn đi ban đầu
    }

    init(); // Call initialization function

    // --- Logout Function ---
    window.logout = async function() {
        try {
            const response = await fetch('/logout');
            if (response.ok) {
                window.location.href = '/index.html';
            } else {
                showMessageBox('Đăng xuất thất bại.', 'error');
            }
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            showMessageBox('Lỗi kết nối. Không thể đăng xuất.', 'error');
        }
    };
});
