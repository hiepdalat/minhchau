let danhSachTam = [];

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = parseInt(document.getElementById('sl').value);
  const dg = parseInt(document.getElementById('dg').value);

  if (!nd || isNaN(sl) || sl <= 0 || isNaN(dg) || dg < 0) {
    alert('Vui lòng nhập đúng nội dung, số lượng và đơn giá!');
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
  danhSachTam.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.noidung}</td>
      <td>${item.soluong}</td>
      <td>${item.dongia}</td>
      <td>${(item.soluong * item.dongia).toLocaleString()}</td>
      <td><button onclick="xoaMon(${index})">❌</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function xoaMon(index) {
  danhSachTam.splice(index, 1);
  capNhatBangTam();
}

async function luuTatCa() {
  const ten = document.getElementById('ten').value.trim();
  const ngay = document.getElementById('ngay').value;
  if (!ten || !ngay || danhSachTam.length === 0) {
    alert('Nhập tên, ngày, và ít nhất 1 món!');
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
    document.getElementById('ten').value = '';
    document.getElementById('ngay').value = '';
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
        <td>${(mon.soluong * mon.dongia).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    loadData(e.target.value.trim());
  }
});

window.onload = () => loadData();
