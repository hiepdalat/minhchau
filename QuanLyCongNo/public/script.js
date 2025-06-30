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
   setTimeout(() => {
    document.getElementById('nd').focus();
  }, 0);
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

/* Các phiên bản loadData cũ đã được thay thế bằng bản ở trên, giữ lại để tham khảo nếu cần */

/* function tinhTongDaChon() bản cũ đã được cập nhật bên dưới */

function tinhTongDaChon() {
  const allCheckboxes = document.querySelectorAll('#ds input[type="checkbox"]');
  const checked = document.querySelectorAll('#ds input[type="checkbox"]:checked');

  let tong = 0;
  checked.forEach(chk => {
    const tr = chk.closest('tr');
    tong += +(tr.querySelector('td:last-child').innerText.replace(/\./g, ''));
  });

  if (tong > 0) {
    document.getElementById('tongCongValue').innerText = tong.toLocaleString();
    document.getElementById('tongCongRow').style.display = '';
  } else {
    document.getElementById('tongCongRow').style.display = 'none';
  }

  const checkAll = document.getElementById('checkAll');
  if (checkAll) {
    checkAll.checked = checked.length === allCheckboxes.length;
  }
}

/* Các phiên bản thanhToan và xoaDaChon cũ đã được cập nhật và giữ lại để tham khảo */

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

  const result = await Swal.fire({
    title: 'Xác nhận thanh toán?',
    text: 'Bạn có chắc muốn đánh dấu thanh toán cho các dòng đã chọn?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Có, thanh toán!',
    cancelButtonText: 'Huỷ bỏ'
  });

  if (!result.isConfirmed) return;

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
    Swal.fire('✅ Thành công', `Đã thanh toán ${demThanhToanMoi} dòng.`, 'success');
  }

  if (daThanhToan.length > 0) {
    Swal.fire('⚠️ Đã thanh toán trước đó', `Các khách hàng sau đã thanh toán:\n- ${daThanhToan.join('\n- ')}`);
  }

  loadData();
}

function inDanhSach() {
  const ds = document.querySelectorAll('#ds tr');
  let rows = [];
  let tongTien = 0;
  let stt = 1;

  ds.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const cells = row.querySelectorAll('td');
      const thanhTien = +(cells[6].innerText.replace(/\./g, ''));
      tongTien += thanhTien;

      rows.push(`
        <tr>
          <td>${stt++}</td>
          <td>${cells[3].innerText}</td>
          <td>${cells[4].innerText}</td>
          <td>${cells[5].innerText}</td>
          <td>${cells[6].innerText}</td>
        </tr>`);
    }
  });

  if (rows.length === 0) {
    alert("Vui lòng chọn ít nhất 1 dòng để in.");
    return;
  }

  const rowsPerPage = 25;
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const ngayIn = new Date();

  const printWindow = window.open('', '', 'width=900,height=600');
  printWindow.document.write(`<html><head><title>Hóa Đơn Bán Hàng</title><style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; color: red; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .left-info, .right-info { width: 45%; font-size: 14px; color: red; }
    .center-title { text-align: center; font-size: 20px; font-weight: bold; margin: 10px 0; color: red; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; color: red; }
    .table th, .table td { border: 1px solid red; padding: 5px; text-align: center; }
    .table th { background-color: #fff; }
    .bold { font-weight: bold; }
    .total-row td { font-weight: bold; }
    .note { margin-top: 10px; font-size: 14px; }
    .sign { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 30px; color: red; }
    .sign div { text-align: center; }
    .dotline { border-bottom: 1px dotted red; width: 100%; display: inline-block; height: 12px; }
  </style></head><body>`);

  for (let i = 0; i < totalPages; i++) {
    printWindow.document.write(`
      <div class="header-section">
        <div class="left-info">
          <b>Điện Nước MINH CHÂU</b><br>
          Đc: Chợ Xuân Thọ<br>
          ĐT: 0973778279 - Zalo: 0938039084<br>
          DD: 0938039084
        </div>
        <div class="right-info">
          
          <div class="bold">Chuyên:</div>
          <div><i>Cung cấp Đây Điện , Bóng đèn .<br> Ống nước PVC, HDPE .<br> Đồ gia dụng và dụng cụ nông nghiệp các loại</i></div>
        </div>
      </div>
      <div class="center">
      <h2><b>HÓA ĐƠN BÁN HÀNG</b></h2>
      </div>

      <div class="info">Người mua hàng: <span class="dotline"></span></div>
      <div class="info">Địa chỉ: <span class="dotline"></span></div>

      <table class="table">
        <tr>
          <th>STT</th>
          <th>Tên hàng</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>
    `);

    const pageRows = rows.slice(i * rowsPerPage, (i + 1) * rowsPerPage);
    printWindow.document.write(pageRows.join(''));

    if (i === totalPages - 1) {
      printWindow.document.write(`
        <tr class="total-row">
          <td colspan="4">Tổng cộng hàng</td>
          <td>${tongTien.toLocaleString()}</td>
        </tr>`);
    }

    printWindow.document.write(`</table>`);

    if (i === totalPages - 1) {
      printWindow.document.write(`
        <div class="info">Bằng chữ: <span class="dotline"></span></div>
        <div class="sign">
          <div>NGƯỚI MUA HÀNG<br><i>(Ký rõ họ tên)</i></div>
          <div>Ngày ${ngayIn.getDate()} Tháng ${ngayIn.getMonth() + 1} Năm ${ngayIn.getFullYear()}<br>
          NGƯỚI VIẾT HÓA ĐƠN</div>
        </div>`);
    }

    if (i < totalPages - 1) printWindow.document.write('<div style="page-break-after: always;"></div>');
  }

  printWindow.document.write(`</body><script>window.print()<\/script></html>`);
  printWindow.document.close();
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
