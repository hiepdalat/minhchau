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
  if (res.ok) {
    alert('Lưu thành công');
    danhSachTam = [];
    capNhatBangTam();
    loadData();
  } else {
    alert('Lưu thất bại');
  }
}

async function loadData(kw = '') {
  const res = await fetch('/timkiem?ten=' + encodeURIComponent(kw));
  const data = await res.json();
  const tbody = document.getElementById('ds');
  tbody.innerHTML = '';
  data.forEach((khach, khachIdx) => {
    khach.hanghoa.forEach((mon, monIdx) => {
      const tt = mon.soluong * mon.dongia;
      tbody.innerHTML += `
        <tr>
          <td><input type="checkbox" onchange="tinhTongDaChon()" data-khach="${khachIdx}" data-mon="${monIdx}"></td>
          <td>${khach.ten}</td>
          <td>${khach.ngay}</td>
          <td>${mon.noidung}</td>
          <td>${mon.soluong}</td>
          <td>${mon.dongia}</td>
          <td>${tt.toLocaleString()}</td>
        </tr>`;
    });
  });
  document.getElementById('tongCongRow').style.display = 'none';
}

function tinhTongDaChon() {
  let tong = 0;
  document.querySelectorAll('#ds input[type=checkbox]:checked').forEach(chk => {
    const tt = +chk.closest('tr').querySelector('td:last-child').innerText.replace(/\./g, '');
    tong += tt;
  });
  if (tong > 0) {
    document.getElementById('tongCongValue').innerText = tong.toLocaleString();
    document.getElementById('tongCongRow').style.display = '';
  } else {
    document.getElementById('tongCongRow').style.display = 'none';
  }
}

function dangXuat() {
  window.location.href = 'index.html';
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadData(e.target.value.trim());
});

window.onload = () => loadData();
