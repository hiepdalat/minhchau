document.addEventListener("DOMContentLoaded", () => {
  const danhSachTam = [];

  const supplierEl = document.getElementById("supplier");
  const dateEl = document.getElementById("date");
  const productEl = document.getElementById("product");
  const unitEl = document.getElementById("unit");
  const qtyEl = document.getElementById("qty");
  const priceEl = document.getElementById("price");
  const discountEl = document.getElementById("discount");
  const addItemBtn = document.getElementById("addItem");
  const saveBtn = document.getElementById("saveBtn");
  const itemsTableBody = document.querySelector("#itemsTable tbody");
  const grandTotalEl = document.getElementById("grandTotal");

  function formatMoney(number) {
    return Number(number).toLocaleString("vi-VN");
  }

  function renderTable() {
    itemsTableBody.innerHTML = "";

    if (danhSachTam.length === 0) {
      itemsTableBody.innerHTML = '<tr id="noData"><td colspan="9">Chưa có mặt hàng</td></tr>';
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
      itemsTableBody.appendChild(row);
    });

    grandTotalEl.textContent = formatMoney(total.toFixed(0));
  }

  window.xoaMuc = function(index) {
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

    productEl.value = unitEl.value = "";
    qtyEl.value = 1;
    priceEl.value = 0;
    discountEl.value = 0;
    productEl.focus();
  });

  saveBtn.addEventListener("click", () => {
    const supplier = supplierEl.value.trim();
    const date = dateEl.value;
    if (!supplier || !date || danhSachTam.length === 0) {
      alert("Vui lòng nhập đủ thông tin và ít nhất 1 mặt hàng.");
      return;
    }

    // Gửi dữ liệu về server (gợi ý - tuỳ backend của bạn)
    fetch("/luu-nhap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier,
        date,
        items: danhSachTam
      })
    })
    .then(res => res.json())
    .then(data => {
      alert("Đã lưu phiếu nhập thành công.");
      danhSachTam.length = 0;
      renderTable();
      supplierEl.value = "";
      dateEl.value = "";
    })
    .catch(err => {
      console.error(err);
      alert("Có lỗi khi lưu phiếu nhập.");
    });
  });
});
