let danhSachTam = [];

function dangXuat() {
  window.location.href = "index.html";
}

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = +document.getElementById('sl').value;
  const dg = +document.getElementById('dg').value;

  if (!nd || sl <= 0 || dg < 0) {
    alert("Nhập đúng nội dung, số lượng, đơn giá!");
    return;
  }

  danhSachTam.push({ noidung: nd, soluong: sl, dongia: dg });
  capNhatBangTam();

  document.getElementById('nd').value = '';
  document.getElementById('sl').value = '';
  document.getElementById('dg').value = '';
}

function capNhatBangTam() {
  const tbody = document.getElementById('bangTam');
  tbody.innerHTML = '';
  danhSachTam.forEach((m, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.noidung}</td>
      <td>${m.soluong}</td>
      <td>${m.dongia}</td>
      <td>${m.soluong * m.dongia}</td>
      <td><button onclick="xoaMon(${i})">❌</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function xoaMon(i) {
  danhSachTam.splice(i, 1);
  capNhatBangTam();
}

async function luuTatCa() {
  const ten = document.getElementById('ten').value.trim();
  const ngay = document.getElementById('ngay').value;
  if (!ten || !ngay || danhSachTam.length === 0) {
    alert('Nhập đầy đủ thông tin');
    return;
  }

  const res = await fetch('/them', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ten, ngay, hanghoa: danhSachTam })
  });

  if (res.ok) {
    danhSachTam = [];
    capNhatBangTam();
    loadData();
  } else {
    alert('Lưu thất bại!');
  }
}

async function loadData(keyword = '') {
  const res = await fetch('/timkiem?ten=' + encodeURIComponent(keyword));
  const data = await res.json();
  const tbody = document.getElementById('ds');
  tbody.innerHTML = '';
  data.forEach(row => {
    row.hanghoa.forEach(mon => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.ten}</td>
        <td>${row.ngay}</td>
        <td>${mon.noidung}</td>
        <td>${mon.soluong}</td>
        <td>${mon.dongia}</td>
        <td>${mon.soluong * mon.dongia}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

window.onload = () => loadData();
