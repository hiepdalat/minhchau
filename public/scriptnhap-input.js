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
        const response = await fetch('/api/nhaphang');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        console.log("✅ Dữ liệu thô từ server:", data);

        allReceipts = [];

        data.forEach(row => {
    const ngay = row.ngay;
    const daily = row.daily;

    if (Array.isArray(row.items)) {
        row.items.forEach(item => {
            allReceipts.push({
                ngay,
                daily,
                tenhang: item.tenhang,
                dvt: item.dvt,
                soluong: item.soluong,
                dongia: item.dongia,
                ck: item.ck,
                gianhap: item.gianhap || 0, // nếu không có thì mặc định 0
                thanhtien: item.thanhtien || 0
            });
                });
            }
        });

        console.log("✅ Dữ liệu đã tải:", allReceipts.length, "mặt hàng.");
               
                
        applyFilters();
    } catch (e) {
        console.error("❌ Lỗi khi tải dữ liệu:", e);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi tải dữ liệu',
            text: 'Không thể tải dữ liệu phiếu nhập hàng. Vui lòng thử lại sau.'
        });
    }
}

        function applyFilters() {
                    console.log("🧪 Tổng số dòng dữ liệu trước lọc:", allReceipts.length);
console.log("🧪 allReceipts[0] =", allReceipts[0]);
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

            console.log("✅ Số kết quả sau lọc:", filteredReceipts.length);

if (filteredReceipts.length > 0) {
    console.log("🧾 Một dòng đầu tiên rõ ràng:", JSON.stringify(filteredReceipts[0], null, 2));
} else {
    console.warn("⚠️ Không có dữ liệu sau lọc.");
}
            renderReceiptsTable(filteredReceipts);
        }

       function renderFilteredResults(receipts) {
    const grouped = {};

    // Gom nhóm từng mặt hàng theo daily + ngay
    receipts.forEach(r => {
        const dateStr = new Date(r.ngay).toISOString().split('T')[0];
        const key = `${r.daily}_${dateStr}`;
        if (!grouped[key]) {
            grouped[key] = {
                daily: r.daily,
                ngay: dateStr,
                items: [],
                tongtien: 0
            };
        }

        grouped[key].items.push(r);
        grouped[key].tongtien += r.thanhtien || 0;
    });

    const tbody = document.getElementById('receiptsTableBody');
    tbody.innerHTML = '';

    const keys = Object.keys(grouped);
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-2 text-gray-500">Không có kết quả phù hợp.</td></tr>`;
        return;
    }

    keys.forEach((key, index) => {
        const receipt = grouped[key];
        const row = document.createElement('tr');

        const encodedDaily = encodeURIComponent(receipt.daily);
        const receiptKey = `${encodedDaily}_${receipt.ngay}`;

        row.innerHTML = `
            <td class="text-center">
                <input type="checkbox" class="receiptCheckbox" data-receipt-key="${receiptKey}">
            </td>
            <td>${index + 1}</td>
            <td>${receipt.daily}</td>
            <td>${new Date(receipt.ngay).toLocaleDateString('vi-VN')}</td>
            <td>${receipt.items.length}</td>
            <td class="text-right">${formatCurrency(receipt.tongtien)}</td>
        `;

        tbody.appendChild(row);
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

                const detailURL = `/print-receipt.html?daily=${encodeURIComponent(dailyName)}&date=${receiptDate}`;
                window.open(detailURL, '_blank');
            });

            loadReceipts();
                   
        });
