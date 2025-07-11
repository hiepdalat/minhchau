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
    khung.style.display = "none";  // Ẩn nếu không có hàng
    return;
  }

  khung.style.display = "block"; // Hiện nếu có ít nhất 1 hàng
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
      })
      .catch(err => {
        console.error(err);
        alert("❌ Không thể lưu phiếu nhập.");
      });
  });

  searchBtn.addEventListener("click", async () => {
    const keyword = document.getElementById("searchSupplier").value.trim();
    if (!keyword) return;

    try {
      const res = await fetch(`/timkiem?ten=${encodeURIComponent(keyword)}`);
      const data = await res.json();

      suggestionsWrap.innerHTML = "";

      if (!data.length) {
        suggestionsWrap.innerHTML = "<div class='suggest-item'>Không tìm thấy đại lý</div>";
        return;
      }

      data.forEach(entry => {
        const div = document.createElement("div");
        div.className = "suggest-item";
        div.textContent = entry.ten;
        div.onclick = () => {
          document.getElementById("supplier").value = entry.ten;
          suggestionsWrap.innerHTML = "";
          taiKetQuaTheoTenDaily(entry.ten);
        };
        suggestionsWrap.appendChild(div);
      });
    } catch (err) {
      console.error("Lỗi tìm đại lý:", err);
      Swal.fire("Lỗi", "Không thể tìm đại lý", "error");
    }
  });

  async function taiKetQuaTheoTenDaily(daily) {
    try {
      const res = await fetch(`/api/stock/search-daily?ten=${encodeURIComponent(daily)}`);
      const data = await res.json();

      const tbody = document.getElementById("bangKetQua");
      if (!tbody) return;

      tbody.innerHTML = "";
      document.getElementById("khungKetQua").style.display = "block";

      if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='8'>Không có kết quả</td></tr>";
        return;
      }

      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.ngay}</td>
          <td>${item.tenhang}</td>
          <td>${item.dvt}</td>
          <td>${item.soluong}</td>
          <td>${item.dongia.toLocaleString()}</td>
          <td>${item.ck}%</td>
          <td>${item.gianhap.toLocaleString()}</td>
          <td>${item.thanhtien.toLocaleString()}</td>
        `;
        row.addEventListener("click", () => {
          row.classList.toggle("selected-row");
          row.dataset.selected = row.dataset.selected === "true" ? "false" : "true";
        });
        tbody.appendChild(row);
      });
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      Swal.fire("Lỗi", "Không thể tải dữ liệu", "error");
    }
  }

  detailBtn.addEventListener("click", () => {
    const table = document.getElementById("bangKetQua");
    if (!table) return;

    const rows = table.querySelectorAll("tr[data-selected='true']");
    if (rows.length === 0) {
      Swal.fire("Thông báo", "Vui lòng chọn một dòng hàng để xem chi tiết", "info");
      return;
    }

    const ngay = rows[0].cells[0].textContent.trim();
    if (!ngay) return;

    inChiTietPhieuNhap(ngay); // ✅ GỌI HÀM in
  });
  
async function inChiTietPhieuNhap(ngay) {
  try {
    const res = await fetch(`/api/stock/receipt-by-date?ngay=${encodeURIComponent(ngay)}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      Swal.fire("Không có phiếu nhập", `Không có dữ liệu cho ngày ${ngay}`, "info");
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

    data.forEach((r, i) => {
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
    Swal.fire("Lỗi", "Không thể in phiếu", "error");
  }
}
  
  document.getElementById("btnLogout").addEventListener("click", () => {
  window.location.href = "/logout";
});
});
