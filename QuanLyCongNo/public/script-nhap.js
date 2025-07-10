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

  function formatMoney(v) {
    return Number(v).toLocaleString("vi-VN");
  }

  function renderTable() {
    tableBody.innerHTML = "";

    if (danhSachTam.length === 0) {
      tableBody.innerHTML = '<tr id="noData"><td colspan="9">Chưa có mặt hàng</td></tr>';
      grandTotalEl.textContent = "0";
      return;
    }

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

  // Hàm xoá món
  window.xoaMuc = function (index) {
    danhSachTam.splice(index, 1);
    renderTable();
  };

  // Thêm món vào danh sách tạm
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

    // Reset form nhập
    productEl.value = "";
    unitEl.value = "";
    qtyEl.value = 1;
    priceEl.value = 0;
    discountEl.value = 0;
    productEl.focus();
  });

  // Lưu phiếu nhập
  saveBtn.addEventListener("click", () => {
    const supplier = supplierEl.value.trim();
    const date = dateEl.value;

    if (!supplier || !date || danhSachTam.length === 0) {
      alert("Vui lòng nhập đầy đủ thông tin và ít nhất 1 món hàng.");
      return;
    }

    const payload = {
      supplier,
      date,
      items: danhSachTam
    };

    fetch("/api/nhap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Lỗi mạng");
      return res.json();
    })
    .then(data => {
      alert("✅ Đã lưu phiếu nhập thành công!");
      // Reset lại form
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
});
document.getElementById("btnSearchSupplier").addEventListener("click", async () => {
  const keyword = document.getElementById("searchSupplier").value.trim();
  if (!keyword) return;

  try {
    const res = await fetch(`/timkiem?ten=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    const wrap = document.getElementById("suggestions");
    wrap.innerHTML = "";

    if (!data.length) {
      wrap.innerHTML = "<div class='suggest-item'>Không tìm thấy đại lý</div>";
      return;
    }

    data.forEach(entry => {
      const div = document.createElement("div");
      div.className = "suggest-item";
      div.textContent = entry.ten;
      div.onclick = () => {
        document.getElementById("supplier").value = entry.ten;
        wrap.innerHTML = "";
      };
      wrap.appendChild(div);
    });
  } catch (err) {
    console.error("Lỗi tìm đại lý:", err);
    Swal.fire("Lỗi", "Không thể tìm đại lý", "error");
  }
});
