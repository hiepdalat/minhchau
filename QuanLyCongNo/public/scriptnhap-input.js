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

        allReceipts = [];
        data.forEach(receipt => {
            const ngay = receipt.ngay?.substring(0, 10);
            const daily = receipt.daily;

            receipt.items.forEach(item => {
                const dongia = parseFloat(item.dongia) || 0;
                const soluong = parseFloat(item.soluong) || 0;
                const ck = parseFloat(item.ck) || 0;
                const gianhap = dongia * (1 - ck / 100);
                const thanhtien = gianhap * soluong;

                allReceipts.push({
                    ngay,
                    daily,
                    tenhang: item.tenhang,
                    dvt: item.dvt,
                    soluong,
                    dongia,
                    ck,
                    gianhap,
                    thanhtien
                });
            });
        });

        console.log("✅ Dữ liệu đã tải:", allReceipts.length, "mặt hàng.");
        applyFilters();
    } catch (e) {
        console.error("❌ Lỗi khi tải dữ liệu:", e);
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
    tbody.innerHTML = '';

    receipts.forEach((item) => {
        const tr = document.createElement('tr');
        const receiptKey = encodeURIComponent(item.daily) + '_' + item.ngay;

        tr.innerHTML = `
            <td><input type="checkbox" class="receiptCheckbox" data-receipt-key="${receiptKey}"></td>
            <td>${new Date(item.ngay).toLocaleDateString('vi-VN')}</td>
            <td>${item.daily}</td>
            <td>${item.tenhang}</td>
            <td>${item.dvt}</td>
            <td>${item.soluong}</td>
            <td>${formatCurrency(item.dongia)}</td>
            <td>${item.ck}%</td>
            <td>${formatCurrency(item.gianhap)}</td>
            <td>${formatCurrency(item.thanhtien)}</td>
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
