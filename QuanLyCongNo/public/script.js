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

function inDanhSach() {
  const ds = document.querySelectorAll('#ds tr');
  let rows = [];
  let tongTien = 0;

  ds.forEach(row => {
    const chk = row.querySelector('input[type="checkbox"]');
    if (chk?.checked) {
      const cells = row.querySelectorAll('td');
      const thanhTien = +(cells[6].innerText.replace(/\./g, ''));
      tongTien += thanhTien;

      rows.push(`
        <tr>
          <td>${cells[1].innerText}</td>
          <td>${cells[2].innerText}</td>
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

  const ngayIn = new Date().toLocaleDateString('vi-VN');

  const printWindow = window.open('', '', 'width=900,height=600');
  printWindow.document.write(`
    <html><head>
      <title>Phiếu Công Nợ</title>
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          text-align: center;
        }
        h1 {
          margin-bottom: 5px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
        }
        .note {
          margin-top: 5px;
          font-size: 14px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
        }
        th {
          background: #f0f0f0;
        }
        tfoot td {
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          font-size: 14px;
          text-align: right;
        }
      </style>
    </head><body>
      <div class="logo">📄 Điện Nước Minh Châu</div>
      <div class="note">Phiếu công nợ được in vào ngày: <b>${ngayIn}</b></div>
      <div class="note">Người lập phiếu: <b>AnhTraiDaLaT</b></div>
      <div class="note">Số Điện Thoại: <b>0938039084</b></div>

      <table>
        <thead>
          <tr>
            <th>Tên khách</th>
            <th>Ngày</th>
            <th>Nội dung</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align:right;">Tổng cộng:</td>
            <td>${tongTien.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <i>Chữ ký người lập phiếu</i>
        <br><br><br>
        ____________________
      </div>

      <script>window.print()<\/script>
    </body></html>
  `);
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
