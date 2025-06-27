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
  data.forEach(kh => {
    kh.hanghoa.forEach((m, j) => {
      tbody.innerHTML += `
        <tr>
          <td><input type="checkbox" onchange="tinhTongDaChon()" data-id="${kh._id}" data-index="${j}"></td>
          <td>${kh.ten}</td>
          <td>${kh.ngay}</td>
          <td>${m.noidung}</td>
          <td>${m.soluong}</td>
          <td>${m.dongia.toLocaleString()}</td>
          <td>${(m.soluong * m.dongia).toLocaleString()}</td>
        </tr>`;
    });
  });
  document.getElementById('tongCongRow').style.display = 'none';
}

function tinhTongDaChon() {
  let tong = 0;
  document.querySelectorAll('#ds input[type="checkbox"]:checked').forEach(chk => {
    const tr = chk.closest('tr');
    tong += +(tr.querySelector('td:last-child').innerText.replace(/\./g, ''));
  });
  if (tong > 0) {
    document.getElementById('tongCongValue').innerText = tong.toLocaleString();
    document.getElementById('tongCongRow').style.display = '';
  } else {
    document.getElementById('tongCongRow').style.display = 'none';
  }
}

/*async function xoaDaChon() {
  const checks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (checks.length === 0) {
    alert('Chọn dòng cần xoá!');
    return;
  }
  for (const chk of checks) {
    await fetch('/xoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
    });
  }
  loadData();
}*/
async function xoaDaChon() {
  const checks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (checks.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Chưa chọn dòng nào',
      text: 'Vui lòng chọn ít nhất một dòng để xoá!',
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Bạn có chắc chắn?',
    text: "Bạn muốn xoá nợ cho khách đã chọn?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Vâng, xoá ngay!',
    cancelButtonText: 'Không'
  });

  if (result.isConfirmed) {
    for (const chk of checks) {
      await fetch('/xoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
      });
    }

    Swal.fire('Đã xoá!', 'Dữ liệu đã được xoá thành công.', 'success');
    loadData();
  }
}

function chonTatCa(source) {
  const checkboxes = document.querySelectorAll('#ds input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = source.checked);
  tinhTongDaChon();
}

function dangXuat() {
  window.location.href = '/index.html';
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    loadData(e.target.value.trim());
  }
});

window.addEventListener('load', () => {
  loadData();
 
});
