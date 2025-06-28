let danhSachTam = [];

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = +document.getElementById('sl').value;
  const dg = +document.getElementById('dg').value;

  if (!nd || sl <= 0 || dg < 0) {
    alert('Nhập đúng dữ liệu');
    return;
  }

  danhSachTam.push({ noidung: nd, soluong: sl, dongia: dg, thanhtoan: false });
  capNhatBangTam();

  //  Hiện phần Món Tạm khi có dữ liệu
  document.getElementById('monTamBox').style.display = 'block';

  document.getElementById('nd').value = '';
  document.getElementById('sl').value = '';
  document.getElementById('dg').value = '';
// Di chuyển con trỏ về lại ô Nội dung
  document.getElementById('nd').focus();
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
  document.getElementById('monTamBox').style.display = danhSachTam.length > 0 ? 'block' : 'none';
}

function xoaMon(i) {
  danhSachTam.splice(i, 1);
  capNhatBangTam(); //đã tự kiểm tra hiển thị ở đây rồi
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
      const isThanhToan = m.thanhtoan === true;

      tbody.innerHTML += `
        <tr class="${isThanhToan ? 'tr-thanh-toan' : ''}">
    <td>
      <input type="checkbox"
             onchange="tinhTongDaChon()"
             data-id="${kh._id}"
             data-index="${j}">
    </td>
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
/*async function loadData(kw = '') {
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
}*/

/*function tinhTongDaChon() {
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
}*/

function tinhTongDaChon() {
  const allCheckboxes = document.querySelectorAll('#ds input[type="checkbox"]');
  const checked = document.querySelectorAll('#ds input[type="checkbox"]:checked');

  let tong = 0;
  checked.forEach(chk => {
    const tr = chk.closest('tr');
    tong += +(tr.querySelector('td:last-child').innerText.replace(/\./g, ''));
  });

  // Hiển thị tổng cộng nếu có chọn
  if (tong > 0) {
    document.getElementById('tongCongValue').innerText = tong.toLocaleString();
    document.getElementById('tongCongRow').style.display = '';
  } else {
    document.getElementById('tongCongRow').style.display = 'none';
  }

  // Cập nhật trạng thái "Chọn tất cả"
  const checkAll = document.getElementById('checkAll');
  if (checkAll) {
    checkAll.checked = checked.length === allCheckboxes.length;
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

async function thanhToan() {
  const checks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (checks.length === 0) {
    alert('Bạn chưa chọn dòng nào để thanh toán!');
    return;
  }

  let daThanhToan = [];
  let demThanhToanMoi = 0;

  for (const chk of checks) {
    const tr = chk.closest('tr');
    const id = chk.dataset.id;
    const index = chk.dataset.index;

    if (tr.classList.contains('tr-thanh-toan')) {
      const tenKH = tr.children[1].innerText;
      if (!daThanhToan.includes(tenKH)) daThanhToan.push(tenKH);
      continue;
    }

    const res = await fetch('/thanhtoan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, index })
    });

    const result = await res.json();
    if (!result.ok) {
      alert(`Lỗi khi thanh toán cho khách hàng ID: ${id}`);
    } else {
      demThanhToanMoi++;
    }
  }

  if (demThanhToanMoi > 0) {
    alert(`✅ Đã thanh toán thành công cho ${demThanhToanMoi} dòng.`);
  }

  if (daThanhToan.length > 0) {
    alert(`⚠️ Các khách hàng sau đã thanh toán trước đó:\n- ${daThanhToan.join('\n- ')}`);
  }

  loadData();
}

/*function thanhToan() {
  const checks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (checks.length === 0) {
    alert('Bạn chưa chọn dòng nào để thanh toán!');
    return;
  }*/
/*async function thanhToan() {
  const checks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
  if (checks.length === 0) {
    alert('Bạn chưa chọn dòng nào để thanh toán!');
    return;
  }

  for (const chk of checks) {
    const id = chk.dataset.id;
    const index = chk.dataset.index;

    // Gửi yêu cầu cập nhật thanhtoan = true lên server
    const res = await fetch('/thanhtoan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, index })
    });

    const result = await res.json();
    if (!result.ok) {
      alert(`Lỗi khi thanh toán cho khách hàng ID: ${id}`);
    }
  }

  alert('Đã thanh toán thành công cho các dòng đã chọn.');
  loadData(); // Tải lại bảng để cập nhật highlight
}
  checks.forEach(chk => {
    const tr = chk.closest('tr');
    tr.classList.add('tr-thanh-toan'); // Thêm class CSS để highlight
    chk.checked = false; // (Tùy chọn) bỏ tick sau khi thanh toán
  });

  tinhTongDaChon(); // Cập nhật lại tổng sau khi bỏ tick
  alert('Đã đánh dấu thanh toán cho các dòng đã chọn.');
}
*/
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
