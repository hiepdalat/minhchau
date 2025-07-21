function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
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
    console.log("Đang tải dữ liệu nhập hàng...");
    try {
        const response = await fetch('/api/nhaphang');
        if (!response.ok) {
            if (response.status === 401) {
                console.warn("Chưa đăng nhập hoặc phiên hết hạn, chuyển hướng về trang đăng nhập.");
                window.location.href = '/index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allReceipts = data;
        console.log("Dữ liệu nhập hàng đã tải:", allReceipts.length, "mục.");
        applyFilters();
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu nhập hàng từ server:", e);
    }
}

function applyFilters() {
  const searchTerm = removeDiacritics(document.getElementById('searchInput').value.trim().toLowerCase());
  const searchMonth = document.getElementById('monthInput').value.trim();

  console.log('applyFilters: searchTerm=\'' + searchTerm + '\', searchMonth=\'' + searchMonth + '\'');

  const filteredReceipts = allReceipts.filter(receipt => {
    const ngay = receipt.ngay ? new Date(receipt.ngay) : null;
    const monthMatch = !searchMonth || (ngay && ngay.toISOString().slice(0, 7) === searchMonth);

    const dailyStr = removeDiacritics(receipt.daily || '');
    const itemsStr = receipt.items.map(item => removeDiacritics(item.name || '')).join(' ');

    const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemsStr.includes(searchTerm);

    return monthMatch && searchMatch;
  });

  console.log('filteredReceipts length: ' + filteredReceipts.length);
  renderReceiptsTable(filteredReceipts);
}

function renderReceiptsTable(receipts) {
  const tableBody = document.querySelector("#receiptsTable tbody");
  tableBody.innerHTML = "";

  receipts.forEach((receipt, index) => {
    const { daily, ngay, items } = receipt;
    const formattedDate = new Date(ngay).toLocaleDateString("vi-VN");

    // Tạo hàng header cho nhóm phiếu nhập
    const groupRow = document.createElement("tr");
    const groupCell = document.createElement("td");
    groupCell.colSpan = 10;
    groupCell.style.backgroundColor = "#1e293b";
    groupCell.style.color = "#fff";
    groupCell.textContent = `Đại lý: ${daily || "Không có"} | Ngày: ${formattedDate}`;
    groupRow.appendChild(groupCell);
    tableBody.appendChild(groupRow);

    items.forEach(item => {
      const row = document.createElement("tr");

      const tdCheck = document.createElement("td");
      tdCheck.innerHTML = `<input type="checkbox">`;

      const tdNgay = document.createElement("td");
      tdNgay.textContent = formattedDate;

      const tdDaily = document.createElement("td");
      tdDaily.textContent = daily;

      const tdTen = document.createElement("td");
      tdTen.textContent = item.ten || "—";

      const tdDvt = document.createElement("td");
      tdDvt.textContent = item.dvt || "—";

      const tdSl = document.createElement("td");
      tdSl.textContent = item.sl || 0;

      const tdGia = document.createElement("td");
      tdGia.textContent = formatCurrency(item.gia || 0);

      const tdCk = document.createElement("td");
      tdCk.textContent = (item.ck || 0) + "%";

      const giaNhap = (item.gia || 0) * (1 - (item.ck || 0) / 100);
      const tdGiaNhap = document.createElement("td");
      tdGiaNhap.textContent = formatCurrency(giaNhap);

      const tdThanhTien = document.createElement("td");
      tdThanhTien.textContent = formatCurrency(giaNhap * (item.sl || 0));

      row.append(
        tdCheck,
        tdNgay,
        tdDaily,
        tdTen,
        tdDvt,
        tdSl,
        tdGia,
        tdCk,
        tdGiaNhap,
        tdThanhTien
      );

      tableBody.appendChild(row);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchDailyNameInput')?.addEventListener('input', applyFilters);
    document.getElementById('searchMonth')?.addEventListener('change', applyFilters);

    document.getElementById('viewDetailsBtn')?.addEventListener('click', () => {
        const selectedKeys = Array.from(document.querySelectorAll('.receipt-checkbox:checked'))
            .map(cb => cb.dataset.receiptKey);

        if (selectedKeys.length !== 1) {
            Swal.fire('Chọn 1 dòng duy nhất', 'Vui lòng chọn đúng 1 phiếu để xem chi tiết.', 'warning');
            return;
        }

        const [dailyNameRaw, receiptDate] = selectedKeys[0].split('_');
        const dailyName = decodeURIComponent(dailyNameRaw);
        const detailURL = `/chi-tiet-phieu-nhap?daily=${encodeURIComponent(dailyName)}&ngay=${receiptDate}`;
        window.open(detailURL, '_blank');
    });

    // Nếu có ticker thời gian bạn có thể bật lại
    // setupDateTicker();

    loadReceipts();
});
