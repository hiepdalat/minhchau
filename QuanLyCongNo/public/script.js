let danhSachTam = [];

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = +document.getElementById('sl').value;
  const dg = +document.getElementById('dg').value;
  if (!nd || sl <= 0 || dg < 0) {
    alert('Nhập đúng dữ liệu');
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
  danhSachTam.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.noidung}</td>
        <td>${item.soluong}</td>
        <td>${item.dongia}</td>
        <td>${(item.soluong * item.dongia).toLocaleString()}</td>
        <td><button onclick="xoaMon(${i})">❌</button></td>
      </tr>`;
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
    alert('Nhập tên, ngày và món');
    return;
  }
  const res = await fetch('/them', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ten, ngay, hanghoa: danhSachTam })
  });
  const data = await res.json();
  if (res.ok && data.success) {
    alert(data.message);
    danhSachTam = [];
    capNhatBangTam();
    document.getElementById('ten').value = '';
    document.getElementById('ngay').value = '';
    loadData();
  } else {
    alert(data.message || 'Lưu thất bại');
  }
}

async function loadData(kw = '') {
  const url = kw ? `/timkiem?ten=${encodeURIComponent(kw)}` : '/danhsach';
  const res = await fetch(url);
  const data = await res.json();
  const tbody = document.getElementById('ds');
  tbody.innerHTML = '';
  data.forEach(khach => {
    khach.hanghoa.forEach(mon => {
      tbody.innerHTML += `
        <tr>
          <td>${khach.ten}</td>
          <td>${khach.ngay}</td>
          <td>${mon.noidung}</td>
          <td>${mon.soluong}</td>
          <td>${mon.dongia}</td>
          <td>${(mon.soluong * mon.dongia).toLocaleString()}</td>
        </tr>`;
    });
  });
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    loadData(e.target.value.trim());
  }
});
