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
  data.forEach(khach => {
    (khach.hanghoa || []).forEach(mon => {
      if (!mon) return;
      tbody.innerHTML += `
        <tr>
          <td><input type="checkbox" onchange="tinhTongDaChon()"></td>
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

function tinhTongDaChon() {
  const checks = document.querySelectorAll('#ds input[type=checkbox]:checked');
  let tong = 0;
  checks.forEach(chk => {
    const td = chk.closest('tr').lastElementChild;
    tong += parseInt(td.innerText.replace(/,/g, '')) || 0;
  });
  document.getElementById('tongCongValue').innerText = tong.toLocaleString();
  document.getElementById('tongCongRow').style.display = checks.length ? '' : 'none';
}

async function xoaDaChon() {
  const checks = document.querySelectorAll('#ds input[type=checkbox]:checked');
  if (!checks.length) {
    alert('Hãy chọn ít nhất 1 dòng để xóa');
    return;
  }
  for (let chk of checks) {
    const tr = chk.closest('tr');
    const ten = tr.cells[1].innerText;
    const ngay = tr.cells[2].innerText;
    await fetch('/xoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ten, ngay })
    });
  }
  alert('Đã xóa thành công');
  loadData();
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadData(e.target.value.trim());
});

window.onload = loadData;
