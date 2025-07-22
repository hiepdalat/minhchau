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
  try {
    const response = await fetch('/api/nhaphang');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // ✅ Chuyển đổi từ receipts dạng nhóm sang từng mặt hàng
    allReceipts = [];
    data.forEach(receipt => {
      const receiptDate = receipt.ngay?.substring(0, 10) || '';
      const dailyName = receipt.daily;

      receipt.items.forEach(item => {
        const itemPrice = parseFloat(item.itemPrice) || 0;
        const itemQuantity = parseFloat(item.itemQuantity) || 0;
        const itemDiscount = parseFloat(item.itemDiscount) || 0;

        const importPrice = itemPrice * (1 - itemDiscount / 100);
        const totalItemAmount = importPrice * itemQuantity;

        allReceipts.push({
          receiptDate,
          dailyName,
          itemName: item.itemName,
          itemUnit: item.itemUnit,
          itemQuantity,
          itemPrice,
          itemDiscount,
          importPrice,
          totalItemAmount
        });
      });
    });

    console.log("✅ Chuyển đổi thành công. Số dòng hàng:", allReceipts.length);
    applyFilters();
  } catch (e) {
    console.error("Lỗi khi tải dữ liệu nhập hàng từ server:", e);
  }
}
function applyFilters() {
  const searchTerm = removeDiacritics(document.getElementById('searchDailyNameInput')?.value.trim().toLowerCase() || '');
  const searchMonth = document.getElementById('searchMonth')?.value || '';

  console.log(`applyFilters: searchTerm='${searchTerm}', searchMonth='${searchMonth}'`);

  const filteredReceipts = allReceipts.filter(receipt => {
    const ngay = receipt.ngay ? new Date(receipt.ngay) : null;
    const monthMatch = !searchMonth || (ngay && ngay.toISOString().slice(0, 7) === searchMonth);

    const dailyStr = removeDiacritics(receipt.daily || '').toLowerCase();
    const itemsStr = receipt.items.map(item => removeDiacritics(item.itemName || '')).join(' ').toLowerCase();

    const searchMatch = !searchTerm || dailyStr.includes(searchTerm) || itemsStr.includes(searchTerm);

    return monthMatch && searchMatch;
  });

  console.log('filteredReceipts length: ' + filteredReceipts.length);
  renderReceiptsTable(filteredReceipts);
}

function renderReceiptsTable(receipts) {
  console.log("⏬ Dữ liệu truyền vào bảng:");
  console.log(receipts); // 👉 kiểm tra dữ liệu từng dòng

  const tbody = document.querySelector("#receiptsTable tbody");
  if (!tbody) {
    console.warn("Không tìm thấy tbody trong bảng #receiptsTable");
    return;
  }

  tbody.innerHTML = "";

  const grouped = {};
  receipts.forEach(item => {
    const key = `${item.receiptDate}__${item.dailyName}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  Object.keys(grouped).forEach(receiptKey => {
    const [receiptDate, dailyName] = receiptKey.split("__");
    const items = grouped[receiptKey];

    // ✅ Header chứa checkbox với data-daily và data-date
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
      <td colspan="10" class="bg-gray-700 text-white font-semibold px-4 py-2">
        <input type="checkbox" class="receipt-checkbox mr-2" data-daily="${dailyName}" data-date="${receiptDate}">
        ▶️ Đại lý: ${dailyName} | Ngày: ${receiptDate}
      </td>`;
    tbody.appendChild(headerRow);

    items.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td></td>
        <td>${item.receiptDate}</td>
        <td>${item.dailyName}</td>
        <td>${item.itemName}</td>
        <td>${item.itemUnit}</td>
        <td>${item.itemQuantity}</td>
        <td>${item.itemPrice} đ</td>
        <td>${item.itemDiscount}%</td>
        <td>${item.importPrice} đ</td>
        <td>${item.totalItemAmount} đ</td>`;
      tbody.appendChild(row);
    });
  });
}
document.getElementById('viewDetailsBtn')?.addEventListener('click', () => {
  const selected = Array.from(document.querySelectorAll('.receipt-checkbox:checked'));

  if (selected.length !== 1) {
    Swal.fire({
      icon: 'warning',
      title: 'Chọn 1 phiếu duy nhất',
      text: 'Vui lòng chọn đúng 1 phiếu để xem chi tiết.'
    });
    return;
  }

  const checkbox = selected[0];
  const daily = checkbox.dataset.daily;
  const date = checkbox.dataset.date;

  const detailURL = `/chi-tiet-phieu-nhap.html?daily=${encodeURIComponent(daily)}&ngay=${date}`;
  window.open(detailURL, '_blank');
});
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
