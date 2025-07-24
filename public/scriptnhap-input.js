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

        async function loadReceipts() {
            try {
                // Adjust this URL if your API endpoint is different
                const response = await fetch('/api/nhaphang');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                allReceipts = [];
                data.forEach(row => {
    const ngay = row.receiptDate;
    const daily = row.dailyName;

    allReceipts.push({
        ngay,
        daily,
        tenhang: row.itemName,
        dvt: row.itemUnit,
        soluong: row.itemQuantity,
        dongia: row.itemPrice,
        ck: row.itemDiscount,
        gianhap: row.importPrice,
        thanhtien: row.totalItemAmount
    });
});
                });

                console.log("✅ Dữ liệu đã tải:", allReceipts.length, "mặt hàng.");
                applyFilters();
            } catch (e) {
                console.error("❌ Lỗi khi tải dữ liệu:", e);
                // Optionally show an error to the user
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi tải dữ liệu',
                    text: 'Không thể tải dữ liệu phiếu nhập hàng. Vui lòng thử lại sau.'
                });
            }
        }

        function applyFilters() {
            const searchTerm = removeDiacritics(document.getElementById('searchDailyNameInput')?.value.trim() || '');
            const searchMonth = document.getElementById('searchMonth')?.value || '';

            console.log(`🔍 Bộ lọc: từ khóa='${searchTerm}', tháng='${searchMonth}'`);

            const filteredReceipts = allReceipts.filter(item => {
                const itemDate = item.ngay ? new Date(item.ngay) : null;
                const monthMatch = !searchMonth || (itemDate && itemDate.toISOString().slice(0, 7) === searchMonth);

                const dailyStr = removeDiacritics(item.daily || '');
                const itemNameStr = removeDiacritics(item.tenhang || '');

                const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemNameStr.includes(searchTerm);

                return monthMatch && searchMatch;
            });

            console.log('✅ Số kết quả sau lọc:', filteredReceipts.length);
            renderReceiptsTable(filteredReceipts);
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
                // Ensure item.daily and item.ngay are not null/undefined before encoding
                const receiptKey = `${encodeURIComponent(item.daily || '')}_${item.ngay || ''}`;


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
            document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
            document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
            document.getElementById('searchMonth')?.addEventListener('change', applyFilters);

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

                const detailURL = `/print-receipt.html?daily=${encodeURIComponent(dailyName)}&ngay=${receiptDate}`;
                window.open(detailURL, '_blank');
            });

            loadReceipts();
        });
