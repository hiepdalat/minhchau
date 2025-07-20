document.addEventListener('DOMContentLoaded', () => {
    // Current date ticker
    const dateTicker = document.getElementById('tickerWrap');
    const updateTicker = () => {
        const now = new Date();
        dateTicker.textContent = now.toLocaleString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };
    updateTicker();
    setInterval(updateTicker, 1000);

    // Get elements for adding items
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
    const inputScrollWrapper = document.getElementById('inputScrollWrapper');

    // Get elements for searching and displaying receipts
    const receiptsSectionCard = document.getElementById('receiptsSectionCard');
    const searchDailyNameInput = document.getElementById('searchDailyNameInput'); // Changed from select to input
    const searchMonthInput = document.getElementById('searchMonth');
    const searchBtn = document.getElementById('searchBtn');
    const receiptsBody = document.getElementById('receiptsBody');
    const grandTotalAllItemsSpan = document.getElementById('grandTotalAllItems');
    const selectAllReceiptsCheckbox = document.getElementById('selectAllReceipts');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const viewDetailsBtn = document.getElementById('viewDetailsBtn');

    let currentReceiptItems = []; // Array to hold items for the current receipt

    // Set current date for receiptDate input
    receiptDateInput.valueAsDate = new Date();

    // Function to format numbers as currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Add item to current receipt table
    addItemBtn.addEventListener('click', () => {
        const dailyName = dailyNameInput.value.trim();
        const receiptDate = receiptDateInput.value;
        const itemName = itemNameInput.value.trim();
        const itemUnit = itemUnitInput.value.trim();
        const itemQuantity = parseFloat(itemQuantityInput.value);
        const itemPrice = parseFloat(itemPriceInput.value);
        const itemDiscount = parseFloat(itemDiscountInput.value);

        if (!dailyName || !receiptDate || !itemName || !itemUnit || isNaN(itemQuantity) || itemQuantity <= 0 || isNaN(itemPrice) || itemPrice < 0 || isNaN(itemDiscount) || itemDiscount < 0 || itemDiscount > 100) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Vui lòng điền đầy đủ và chính xác thông tin mặt hàng, bao gồm Tên đại lý và Ngày nhập.',
                confirmButtonText: 'Đóng'
            });
            return;
        }

        const importPrice = itemPrice * (1 - itemDiscount / 100);
        const totalPrice = importPrice * itemQuantity;

        const newItem = {
            dailyName,
            receiptDate,
            itemName,
            itemUnit,
            itemQuantity,
            itemPrice,
            itemDiscount,
            importPrice: importPrice,
            totalPrice: totalPrice
        };

        currentReceiptItems.push(newItem);
        renderCurrentItems();
        clearItemInputs();
        inputScrollWrapper.classList.remove('hidden'); // Show the table and save button
    });

    // Render items in the current receipt table
    const renderCurrentItems = () => {
        currentItemsBody.innerHTML = '';
        let totalAmount = 0;

        currentReceiptItems.forEach((item, index) => {
            const row = currentItemsBody.insertRow();
            row.innerHTML = `
                <td class="py-2 px-4">${item.itemName}</td>
                <td class="py-2 px-4">${item.itemUnit}</td>
                <td class="py-2 px-4 text-right">${item.itemQuantity}</td>
                <td class="py-2 px-4 text-right">${formatCurrency(item.itemPrice)}</td>
                <td class="py-2 px-4 text-right">${item.itemDiscount}%</td>
                <td class="py-2 px-4 text-right">${formatCurrency(item.importPrice)}</td>
                <td class="py-2 px-4 text-right font-bold text-green-400">${formatCurrency(item.totalPrice)}</td>
                <td class="py-2 px-4 text-center">
                    <button class="btn-delete-item text-red-500 hover:text-red-700" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            totalAmount += item.totalPrice;
        });
        totalAmountSpan.textContent = formatCurrency(totalAmount);

        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-delete-item').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.currentTarget.dataset.index);
                deleteCurrentItem(index);
            });
        });
    };

    // Delete item from current receipt
    const deleteCurrentItem = (index) => {
        currentReceiptItems.splice(index, 1);
        renderCurrentItems();
        if (currentReceiptItems.length === 0) {
            inputScrollWrapper.classList.add('hidden'); // Hide if no items
        }
    };

    // Clear input fields for adding items
    const clearItemInputs = () => {
        itemNameInput.value = '';
        itemUnitInput.value = '';
        itemQuantityInput.value = '1';
        itemPriceInput.value = '0';
        itemDiscountInput.value = '0';
    };

    // Save current receipt
    saveReceiptBtn.addEventListener('click', async () => {
        if (currentReceiptItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Không có mặt hàng!',
                text: 'Vui lòng thêm mặt hàng vào phiếu nhập trước khi lưu.',
                confirmButtonText: 'Đóng'
            });
            return;
        }

        const receiptData = {
            dailyName: dailyNameInput.value.trim(),
            receiptDate: receiptDateInput.value,
            items: currentReceiptItems
        };

        try {
            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(receiptData)
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Phiếu nhập đã được lưu.',
                    confirmButtonText: 'OK'
                });
                currentReceiptItems = []; // Clear items after saving
                renderCurrentItems();
                dailyNameInput.value = ''; // Clear daily name
                receiptDateInput.valueAsDate = new Date(); // Reset date
                inputScrollWrapper.classList.add('hidden'); // Hide the table
                loadReceipts(); // Reload receipts after saving
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: `Không thể lưu phiếu nhập: ${errorData.message || response.statusText}`,
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Lỗi khi lưu phiếu nhập:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error.message}`,
                confirmButtonText: 'Đóng'
            });
        }
    });

    // Load receipts from server
    const loadReceipts = async (searchQuery = '', searchMonth = '') => {
        try {
            let url = '/api/receipts';
            const params = new URLSearchParams();
            if (searchQuery) {
                params.append('q', searchQuery);
            }
            if (searchMonth) {
                params.append('month', searchMonth);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const receipts = await response.json();
                renderReceipts(receipts);
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: `Không thể tải phiếu nhập: ${errorData.message || response.statusText}`,
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải phiếu nhập:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error.message}`,
                confirmButtonText: 'Đóng'
            });
        }
    };

    // Render receipts in the display table
    const renderReceipts = (receipts) => {
        receiptsBody.innerHTML = '';
        let grandTotal = 0;

        if (receipts.length === 0) {
            receiptsBody.innerHTML = '<tr><td colspan="11" class="py-4 text-center text-gray-400">Không tìm thấy phiếu nhập nào.</td></tr>';
            grandTotalAllItemsSpan.textContent = formatCurrency(0);
            return;
        }

        receipts.forEach(receipt => {
            const receiptTotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
            grandTotal += receiptTotal;

            receipt.items.forEach((item, itemIndex) => {
                const row = receiptsBody.insertRow();
                row.classList.add('receipt-item-row'); // Add a class to identify receipt item rows
                row.dataset.receiptId = receipt._id; // Store receipt ID on each row

                row.innerHTML = `
                    <td class="py-2 px-4 text-center">
                        <input type="checkbox" class="receipt-checkbox" data-id="${receipt._id}" ${itemIndex === 0 ? '' : 'disabled'}>
                    </td>
                    <td class="py-2 px-4">${itemIndex === 0 ? new Date(receipt.receiptDate).toLocaleDateString('vi-VN') : ''}</td>
                    <td class="py-2 px-4">${itemIndex === 0 ? receipt.dailyName : ''}</td>
                    <td class="py-2 px-4">${item.itemName}</td>
                    <td class="py-2 px-4">${item.itemUnit}</td>
                    <td class="py-2 px-4 text-right">${item.itemQuantity}</td>
                    <td class="py-2 px-4 text-right">${formatCurrency(item.itemPrice)}</td>
                    <td class="py-2 px-4 text-right">${item.itemDiscount}%</td>
                    <td class="py-2 px-4 text-right">${formatCurrency(item.importPrice)}</td>
                    <td class="py-2 px-4 text-right font-bold text-green-400">${formatCurrency(item.totalPrice)}</td>
                    <td class="py-2 px-4 text-right font-bold text-blue-400">${itemIndex === 0 ? formatCurrency(receiptTotal) : ''}</td>
                `;

                // Add a border below the last item of each receipt
                if (itemIndex === receipt.items.length - 1) {
                    row.classList.add('border-b-2', 'border-gray-600');
                }
            });
        });
        grandTotalAllItemsSpan.textContent = formatCurrency(grandTotal);

        // Show the search section after loading receipts
        receiptsSectionCard.classList.remove('hidden');
    };

    // Initial load of receipts when page loads
    loadReceipts();

    // Search button event listener
    searchBtn.addEventListener('click', () => {
        const query = searchDailyNameInput.value.trim();
        const month = searchMonthInput.value; // YYYY-MM format
        loadReceipts(query, month);
    });

    // Handle select all checkbox
    selectAllReceiptsCheckbox.addEventListener('change', (event) => {
        document.querySelectorAll('.receipt-checkbox').forEach(checkbox => {
            if (!checkbox.disabled) { // Only toggle if not disabled (i.e., first item of a receipt)
                checkbox.checked = event.target.checked;
            }
        });
    });

    // Delete selected receipts
    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedReceiptIds = Array.from(document.querySelectorAll('.receipt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id);

        if (selectedReceiptIds.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Không có phiếu nào được chọn!',
                text: 'Vui lòng chọn ít nhất một phiếu nhập để xóa.',
                confirmButtonText: 'Đóng'
            });
            return;
        }

        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa?',
            text: `Bạn sẽ xóa ${selectedReceiptIds.length} phiếu nhập này. Hành động này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Vâng, xóa đi!',
            cancelButtonText: 'Hủy bỏ'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch('/api/receipts', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ ids: selectedReceiptIds })
                    });

                    if (response.ok) {
                        Swal.fire(
                            'Đã xóa!',
                            'Các phiếu nhập đã chọn đã được xóa.',
                            'success'
                        );
                        loadReceipts(); // Reload receipts after deletion
                    } else {
                        const errorData = await response.json();
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: `Không thể xóa phiếu nhập: ${errorData.message || response.statusText}`,
                            confirmButtonText: 'Đóng'
                        });
                    }
                } catch (error) {
                    console.error('Lỗi khi xóa phiếu nhập:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error.message}`,
                        confirmButtonText: 'Đóng'
                    });
                }
            }
        });
    });

    // View details for selected receipts
    viewDetailsBtn.addEventListener('click', async () => {
        const selectedReceiptIds = Array.from(document.querySelectorAll('.receipt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id);

        if (selectedReceiptIds.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Không có phiếu nào được chọn!',
                text: 'Vui lòng chọn ít nhất một phiếu nhập để xem chi tiết.',
                confirmButtonText: 'Đóng'
            });
            return;
        }

        let detailsHtml = '<div class="table-container" style="max-height: 500px; overflow-y: auto;"><table class="min-w-full bg-gray-800 rounded-lg overflow-hidden">';
        detailsHtml += `<thead>
                            <tr>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Ngày</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Đại lý</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Tên hàng</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">ĐVT</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">SL</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Đơn giá</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">CK(%)</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">G-Nhập</th>
                                <th class="py-2 px-4 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Thành tiền</th>
                            </tr>
                        </thead><tbody>`;
        let totalOverallAmount = 0;

        try {
            const response = await fetch('/api/receipts/details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedReceiptIds })
            });

            if (response.ok) {
                const receiptsDetails = await response.json();

                if (receiptsDetails.length === 0) {
                    detailsHtml += '<tr><td colspan="9" class="py-4 text-center text-gray-400">Không tìm thấy chi tiết cho các phiếu đã chọn.</td></tr>';
                } else {
                    receiptsDetails.forEach(receipt => {
                        const receiptTotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
                        totalOverallAmount += receiptTotal;

                        receipt.items.forEach((item, itemIndex) => {
                            detailsHtml += `
                                <tr>
                                    <td class="py-2 px-4">${itemIndex === 0 ? new Date(receipt.receiptDate).toLocaleDateString('vi-VN') : ''}</td>
                                    <td class="py-2 px-4">${itemIndex === 0 ? receipt.dailyName : ''}</td>
                                    <td class="py-2 px-4">${item.itemName}</td>
                                    <td class="py-2 px-4">${item.itemUnit}</td>
                                    <td class="py-2 px-4 text-right">${item.itemQuantity}</td>
                                    <td class="py-2 px-4 text-right">${formatCurrency(item.itemPrice)}</td>
                                    <td class="py-2 px-4 text-right">${item.itemDiscount}%</td>
                                    <td class="py-2 px-4 text-right">${formatCurrency(item.importPrice)}</td>
                                    <td class="py-2 px-4 text-right font-bold text-green-400">${formatCurrency(item.totalPrice)}</td>
                                </tr>
                            `;
                        });
                        detailsHtml += `
                            <tr>
                                <td colspan="8" class="py-2 px-4 text-right font-bold text-gray-300 border-t border-gray-600">Tổng tiền phiếu này:</td>
                                <td class="py-2 px-4 text-right font-bold text-blue-400 border-t border-gray-600">${formatCurrency(receiptTotal)}</td>
                            </tr>
                        `;
                    });
                }

                detailsHtml += `</tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="8" class="py-2 px-4 text-right font-bold text-gray-300 border-t-2 border-gray-500">Tổng cộng tất cả phiếu đã chọn:</td>
                                        <td class="py-2 px-4 text-right font-bold text-yellow-400 border-t-2 border-gray-500">${formatCurrency(totalOverallAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table></div>`;

                Swal.fire({
                    title: 'Chi tiết phiếu nhập đã chọn',
                    html: detailsHtml,
                    width: '90%',
                    showCloseButton: true,
                    confirmButtonText: 'Đóng',
                    customClass: {
                        container: 'swal2-container-custom',
                        popup: 'swal2-popup-custom',
                        title: 'swal2-title-custom',
                        htmlContainer: 'swal2-html-container-custom',
                    }
                });

            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: `Không thể tải chi tiết phiếu nhập: ${errorData.message || response.statusText}`,
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết phiếu nhập:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error.message}`,
                confirmButtonText: 'Đóng'
            });
        }
    });

    // Logout function (placeholder)
    window.logout = () => {
        Swal.fire({
            title: 'Đăng xuất',
            text: 'Bạn có muốn đăng xuất không?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, đăng xuất!',
            cancelButtonText: 'Không'
        }).then((result) => {
            if (result.isConfirmed) {
                // Perform actual logout logic here, e.g., redirect to login page
                window.location.href = '/login'; // Example: Redirect to a login page
            }
        });
    };
});
