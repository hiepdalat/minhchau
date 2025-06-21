let danhSachTam = [];

function dangXuat() {
  window.location.href = "index.html";
}

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = parseInt(document.getElementById('sl').value);
  const dg = parseInt(document.getElementById('dg').value);

  if (!nd || isNaN(sl) || sl <= 0 || isNaN(dg) || dg < 0) {
    alert("Vui lòng nhập đúng nội dung, số lượng và đơn giá!");
    return;
  }

  danhSachTam.push({ nd, sl, dg });
  capNhatBangTam();

  document.getElementById('nd').value = '';
  document.getElementById('sl').value = '';
  document.getElementById('dg').value = '';
}

function capNhatBangTam() {
  const tbody = document.getElementById('bangTam');
  tbody.innerHTML = '';
  danhSachTam.forEach((item, index) => {
    const thanhTien = item.sl * item.dg;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nd}</td>
      <td>${item.sl}</td>
      <td>${item.dg.toLocaleString()}</td>
      <td>${thanhTien.toLocaleString()}</td>
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
    alert("Vui lòng nhập tên, ngày và ít nhất 1 món!");
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
    document.getElementById('ten').value = '';
    document.getElementById('ngay').value = '';
    loadData();
  } else {
    alert("Lưu thất bại!");
  }
}

async function loadData(keyword = '') {
  const res = await fetch('/timkiem?ten=' + encodeURIComponent(keyword));
  const data = await res.json();

  const tbody = document.getElementById('ds');
  tbody.innerHTML = '';
  data.forEach((row, khachIndex) => {
    row.hanghoa.forEach((mon, monIndex) => {
      const thanhTien = mon.sl * mon.dg;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="chon-xoa" data-khach="${khachIndex}" data-mon="${monIndex}" onchange="tinhTongDaChon()"></td>
        <td>${row.ten}</td>
        <td>${row.ngay}</td>
        <td>${mon.nd}</td>
        <td>${mon.sl}</td>
        <td>${mon.dg.toLocaleString()}</td>
        <td>${thanhTien.toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  document.getElementById('tongCongRow').style.display = 'none';
}

async function xoaDaChon() {
  let data = await (await fetch('/timkiem')).json();

  const checks = document.querySelectorAll('.chon-xoa:checked');
  if (checks.length === 0) {
    alert('Hãy chọn ít nhất 1 dòng để xoá!');
    return;
  }

  // Tập hợp dòng cần xoá
  const toDelete = [];
  checks.forEach(chk => {
    toDelete.push({
      khach: +chk.dataset.khach,
      mon: +chk.dataset.mon
    });
  });

  // Xoá từ cuối lên tránh lệch chỉ số
  toDelete.sort((a, b) => b.khach - a.khach || b.mon - a.mon);
  toDelete.forEach(({ khach, mon }) => {
    data[khach].hanghoa.splice(mon, 1);
    if (data[khach].hanghoa.length === 0) {
      data.splice(khach, 1);
    }
  });

  await fetch('/luu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  loadData();
}

function tinhTongDaChon() {
  const checks = document.querySelectorAll('.chon-xoa:checked');
  if (checks.length === 0) {
    document.getElementById('tongCongRow').style.display = 'none';
    return;
  }

  let tong = 0;
  checks.forEach(chk => {
    const tr = chk.closest('tr');
    const thanhTien = tr.querySelector('td:last-child').innerText.replace(/\./g, '');
    tong += parseInt(thanhTien);
  });

  document.getElementById('tongCongValue').innerText = tong.toLocaleString();
  document.getElementById('tongCongRow').style.display = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const nd = document.getElementById('nd').value.trim();
    const sl = parseInt(document.getElementById('sl').value);
    const dg = parseInt(document.getElementById('dg').value);

    // Kiểm tra đủ dữ liệu hợp lệ mới thêm món
    if (nd && !isNaN(sl) && sl > 0 && !isNaN(dg) && dg >= 0) {
      themMon();
      e.preventDefault(); // Chặn reload trang nếu form bị submit
    }
  }
});

document.getElementById('search').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const keyword = this.value.trim();
    loadData(keyword);
    e.preventDefault(); // Chặn submit form nếu có
  }
});

window.onload = () => loadData();