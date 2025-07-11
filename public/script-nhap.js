// ========================= script-nhap.js =========================
document.addEventListener("DOMContentLoaded", () => {
  const danhSachTam = [];

  // DOM Elements
  const supplierEl = document.getElementById("supplier");
  const dateEl = document.getElementById("date");
  const productEl = document.getElementById("product");
  const unitEl = document.getElementById("unit");
  const qtyEl = document.getElementById("qty");
  const priceEl = document.getElementById("price");
  const discountEl = document.getElementById("discount");
  const addItemBtn = document.getElementById("addItem");
  const saveBtn = document.getElementById("saveBtn");
  const tableBody = document.querySelector("#itemsTable tbody");
  const grandTotalEl = document.getElementById("grandTotal");
  const searchBtn = document.getElementById("btnSearchSupplier");
  const suggestionsWrap = document.getElementById("suggestions");
  const detailBtn = document.getElementById("detailBtn");

  function formatMoney(v) {
    return Number(v).toLocaleString("vi-VN");
  }

  function renderTable() {
    const khung = document.getElementById("khungDanhSachTam");

    if (danhSachTam.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9">Chưa có mặt hàng</td></tr>';
      grandTotalEl.textContent = "0";
      khung.style.display = "none";
      return;
    }

    khung.style.display = "block";
    tableBody.innerHTML = "";
    let total = 0;

    danhSachTam.forEach((item, index) => {
      const giaNhap = item.price * (1 - item.discount / 100);
      const thanhTien = giaNhap * item.qty;
      total += thanhTien;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.product}</td>
        <td>${item.unit}</td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.price)}</td>
        <td>${item.discount}%</td>
        <td>${formatMoney(giaNhap.toFixed(0))}</td>
        <td>${formatMoney(thanhTien.toFixed(0))}</td>
        <td><button onclick="xoaMuc(${index})">❌</button></td>
      `;
      tableBody.appendChild(row);
    });

    grandTotalEl.textContent = formatMoney(total.toFixed(0));
  }

  window.xoaMuc = function (index) {
    danhSachTam.splice(index, 1);
    renderTable();
  };

  addItemBtn.addEventListener("click", () => {
    const item = {
      product: productEl.value.trim(),
      unit: unitEl.value.trim(),
      qty: parseInt(qtyEl.value),
      price: parseFloat(priceEl.value),
      discount: parseFloat(discountEl.value)
    };

    if (!item.product || !item.unit || isNaN(item.qty) || isNaN(item.price)) {
      alert("Vui lòng nhập đầy đủ thông tin mặt hàng.");
      return;
    }

    danhSachTam.push(item);
    renderTable();

    productEl.value = "";
    unitEl.value = "";
    qtyEl.value = 1;
    priceEl.value = 0;
    discountEl.value = 0;
    productEl.focus();
  });

  saveBtn.addEventListener("click", () => {
    const supplier = supplierEl.value.trim();
    const date = dateEl.value;

    if (!supplier || !date || danhSachTam.length === 0) {
      alert("Vui lòng nhập đầy đủ thông tin và ít nhất 1 món hàng.");
      return;
    }

    const payload = { supplier, date, items: danhSachTam };

    fetch("/api/stock/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        alert("✅ Đã lưu phiếu nhập thành công!");
        supplierEl.value = "";
        dateEl.value = "";
        danhSachTam.length = 0;
        renderTable();
        taiKetQuaTheoTenDaily(supplier);
      })
      .catch(err => {
        console.error(err);
        alert("❌ Không thể lưu phiếu nhập.");
      });
  });

 searchBtn.addEventListener("click", async () => {
  const ten = document.getElementById("searchSupplier").value.trim();
  const thang = document.getElementById("searchMonth").value;
  if (!ten || !thang) return;

  try {
    const url = `/api/stock/search-daily?ten=${encodeURIComponent(ten)}&thang=${encodeURIComponent(thang)}`;
    const res = await fetch(url);
    const data = await res.json();

    const tbody = document.getElementById("bangKetQua");
    tbody.innerHTML = "";
    document.getElementById("khungKetQua").style.display = "block";

    if (!data.length) {
      tbody.innerHTML = "<tr><td colspan='9'>Không có kết quả</td></tr>";
      return;
    }

    data.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" class="row-check"></td>
        <td>${item.ngay}</td>
        <td>${item.tenhang}</td>
        <td>${item.dvt}</td>
        <td>${item.soluong}</td>
        <td>${Number(item.dongia).toLocaleString()}</td>
        <td>${item.ck}%</td>
        <td>${Number(item.gianhap).toLocaleString()}</td>
        <td>${Number(item.thanhtien).toLocaleString()}</td>
      `;
      row.dataset.ngay = item.ngay;
      row.dataset.id = item._id; //tôi đã đặt ở đây 
      row.dataset.daily = item.daily;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Lỗi tìm đại lý:", err);
    alert("Không thể tìm đại lý hoặc mặt hàng");
  }
});

detailBtn.addEventListener("click", () => {
  const rows = [...document.querySelectorAll("#bangKetQua tr")]
    .filter(tr => tr.querySelector(".row-check")?.checked);

  if (rows.length === 0) {
    Swal.fire("Thông báo", "Vui lòng chọn 1 dòng để xem chi tiết", "info");
    return;
  }

  const ngay = rows[0].dataset.ngay;
  inChiTietPhieuNhap(ngay);
});

document.getElementById("btnDeleteSelected").addEventListener("click", async () => {
  const rows = [...document.querySelectorAll("#bangKetQua tr")]
    .filter(tr => tr.querySelector(".row-check")?.checked);

  if (rows.length === 0) {
    Swal.fire("Chưa chọn", "Vui lòng chọn dòng cần xóa", "warning");
    return;
  }

  const ngay = rows[0].dataset.ngay;
  const daily = rows[0].dataset.daily;

  const confirm = await Swal.fire({
    title: "Bạn có chắc?",
    text: `Xóa toàn bộ mặt hàng đã nhập của "${daily}" vào ngày ${ngay}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "✅ Xóa",
    cancelButtonText: "❌ Hủy"
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`/api/stock/delete?ngay=${encodeURIComponent(ngay)}&daily=${encodeURIComponent(daily)}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire("Đã xóa", "Dữ liệu đã được xóa", "success");
        searchBtn.click(); // load lại
      } else {
        Swal.fire("Lỗi", result.error || "Không thể xóa", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Xóa thất bại", "error");
    }
  }
});
  
  async function inChiTietPhieuNhap(ngay) {
    try {
      const res = await fetch(`/api/stock/receipt-by-date?ngay=${encodeURIComponent(ngay)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert(`Không có dữ liệu cho ngày ${ngay}`);
        return;
      }

      const win = window.open('', '_blank');
      let html = `<html><head><title>Phiếu nhập</title>
        <style>
          body { font-family: Arial; color: #000; max-width: 800px; margin: auto; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; }
          th { background: #f0f0f0; }
        </style></head><body>`;

      html += `<h2>🧾 PHIẾU NHẬP HÀNG</h2><p><b>Ngày:</b> ${ngay}</p>`;

      data.forEach((r) => {
        html += `<p><b>Đại lý:</b> ${r.daily}</p>
          <table>
            <thead><tr>
              <th>STT</th><th>Tên hàng</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th>
              <th>CK</th><th>Giá nhập</th><th>Thành tiền</th>
            </tr></thead><tbody>`;

        r.items.forEach((item, idx) => {
          html += `<tr>
            <td>${idx + 1}</td>
            <td>${item.tenhang}</td>
            <td>${item.dvt}</td>
            <td>${item.soluong}</td>
            <td>${Number(item.dongia).toLocaleString()}</td>
            <td>${item.ck}%</td>
            <td>${Number(item.gianhap).toLocaleString()}</td>
            <td>${Number(item.thanhtien).toLocaleString()}</td>
          </tr>`;
        });

        html += `<tr>
          <td colspan="7" style="text-align:right;"><b>Tổng cộng:</b></td>
          <td><b>${Number(r.tongtien).toLocaleString()}</b></td>
        </tr></tbody></table>`;
      });

      html += `<p style="text-align:right;">Người lập phiếu: <i>(ký tên)</i></p></body></html>`;

      win.document.write(html);
      win.document.close();
      win.print();
    } catch (err) {
      console.error("Lỗi khi in phiếu:", err);
      alert("Không thể in phiếu");
    }
  }

  document.getElementById("btnLogout").addEventListener("click", () => {
    window.location.href = "/logout";
  });
});
