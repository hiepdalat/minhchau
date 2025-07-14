// ===== script-nhap.js (hoan chinh - CÁCH 1: lọc không dấu phía client) =====
document.addEventListener('DOMContentLoaded', async () => {
    function removeVietnameseTones(str) {
        return str.normalize("NFD")
            .replace(/\p{Diacritic}/gu, '')
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .toLowerCase();
    }

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
    const viewDetailsBtn = document.getElementById('viewDetailsBtn');
    const receiptsBody = document.getElementById('receiptsBody');
    const selectAllReceiptsCheckbox = document.getElementById('selectAllReceipts');
    const grandTotalAllItemsSpan = document.getElementById('grandTotalAllItems');
    const receiptsSectionCard = document.getElementById('receiptsSectionCard');
    const inputScrollWrapper = document.getElementById("inputScrollWrapper");

    let currentReceiptItems = [];

    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    function calculateItemTotals(price, discount, quantity) {
        const gianhap = price - (price * (discount / 100));
        const thanhtien = gianhap * quantity;
        return { gianhap, thanhtien };
    }

    function renderCurrentItems() {
        currentItemsBody.innerHTML = '';
        let totalAmount = 0;

        currentReceiptItems.forEach((item, index) => {
            const row = currentItemsBody.insertRow();
            row.innerHTML = `
                <td>${item.tenhang}</td>
                <td>${item.dvt}</td>
                <td>${item.soluong}</td>
                <td>${formatCurrency(item.dongia)}</td>
                <td>${item.ck}%</td>
                <td>${formatCurrency(item.gianhap)}</td>
                <td>${formatCurrency(item.thanhtien)}</td>
                <td><button class="remove-item-btn" data-index="${index}">Xóa</button></td>
            `;
            totalAmount += item.thanhtien;
        });

        totalAmountSpan.textContent = formatCurrency(totalAmount);
        if (currentReceiptItems.length > 0) {
            inputScrollWrapper.classList.remove('hidden');
            saveReceiptBtn.classList.remove('hidden');
        } else {
            inputScrollWrapper.classList.add('hidden');
            saveReceiptBtn.classList.add('hidden');
        }
    }

    addItemBtn.addEventListener('click', async () => {
        const tenhang = itemNameInput.value.trim();
        const dvt = itemUnitInput.value.trim();
        const soluong = parseInt(itemQuantityInput.value);
        const dongia = parseFloat(itemPriceInput.value);
        const ck = parseFloat(itemDiscountInput.value);

        if (!tenhang || !dvt || isNaN(soluong) || soluong <= 0 || isNaN(dongia) || dongia < 0 || isNaN(ck) || ck < 0 || ck > 100) return;

        const { gianhap, thanhtien } = calculateItemTotals(dongia, ck, soluong);

        currentReceiptItems.push({ tenhang, dvt, soluong, dongia, ck, gianhap, thanhtien });
        renderCurrentItems();

        itemNameInput.value = '';
        itemUnitInput.value = '';
        itemQuantityInput.value = '1';
        itemPriceInput.value = '0';
        itemDiscountInput.value = '0';
        itemNameInput.focus();
    });

    currentItemsBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const index = parseInt(event.target.dataset.index);
            currentReceiptItems.splice(index, 1);
            renderCurrentItems();
        }
    });

    searchBtn.addEventListener('click', fetchAndRenderReceipts);

    async function fetchAndRenderReceipts() {
        receiptsBody.innerHTML = '<tr><td colspan="11">Đang tải dữ liệu...</td></tr>';

        const dailySearchRaw = searchDailyNameInput.value.trim();
        const dailySearch = removeVietnameseTones(dailySearchRaw);
        const monthSearch = searchMonthInput.value;

        if (!dailySearchRaw && !monthSearch) {
            receiptsBody.innerHTML = '<tr><td colspan="11">Vui lòng nhập tiêu chí tìm kiếm.</td></tr>';
            receiptsSectionCard.classList.add('hidden');
            return;
        }

        const url = '/api/nhaphang';

        try {
            const response = await fetch(url);
            if (response.ok) {
                const receipts = await response.json();
                receiptsBody.innerHTML = '';
                let grandTotal = 0;

                receiptsSectionCard.classList.remove('hidden');

                const filteredReceipts = receipts.filter(receipt => {
                    const dailyName = removeVietnameseTones(receipt.daily || '');
                    const matchDaily = !dailySearch || dailyName.includes(dailySearch);

                    const matchMonth = !monthSearch || (receipt.ngay && receipt.ngay.startsWith(monthSearch));

                    return matchDaily && matchMonth;
                });

                if (filteredReceipts.length === 0) {
                    receiptsBody.innerHTML = '<tr><td colspan="11">Không tìm thấy phiếu nhập nào.</td></tr>';
                    grandTotalAllItemsSpan.textContent = formatCurrency(0);
                    return;
                }

                filteredReceipts.forEach(receipt => {
                    const receiptDate = new Date(receipt.ngay);
                    const formattedDate = receiptDate.toLocaleDateString('vi-VN');

                    receipt.items.forEach((item) => {
                        const row = receiptsBody.insertRow();
                        row.innerHTML = `
                            <td><input type="checkbox" class="item-checkbox" data-receipt-id="${receipt._id}" data-item-id="${item._id}"></td>
                            <td>${formattedDate}</td>
                            <td>${receipt.daily}</td>
                            <td>${item.tenhang}</td>
                            <td>${item.dvt}</td>
                            <td>${item.soluong}</td>
                            <td>${formatCurrency(item.dongia)}</td>
                            <td>${item.ck}%</td>
                            <td>${formatCurrency(item.gianhap)}</td>
                            <td>${formatCurrency(item.thanhtien)}</td>
                            <td>${formatCurrency(receipt.tongtien)}</td>
                        `;
                        grandTotal += item.thanhtien;
                    });
                });

                grandTotalAllItemsSpan.textContent = formatCurrency(grandTotal);
            }
        } catch (error) {
            console.error('Lỗi fetch:', error);
            receiptsBody.innerHTML = '<tr><td colspan="11">Lỗi tải dữ liệu.</td></tr>';
        }
    }
});
