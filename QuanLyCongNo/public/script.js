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
  try {
    const res = await fetch('/timkiem?ten=' + encodeURIComponent(kw));
    if (!res.ok) throw new Error('Lỗi kết nối server');
    const data = await res.json();

    const tbody = document.getElementById('ds');
    tbody.innerHTML = '';

    let danhSachMon = [];

    data.forEach(kh => {
      if (!kh.hanghoa || !Array.isArray(kh.hanghoa)) return; // bỏ qua nếu không có dữ liệu hàng hóa

      kh.hanghoa.forEach((m, j) => {
        danhSachMon.push({
          ten: kh.ten,
          ngay: kh.ngay,
          _id: kh._id,
          index: j,
          noidung: m.noidung,
          soluong: m.soluong,
          dongia: m.dongia,
          thanhtoan: m.thanhtoan
        });
      });
    });

    // Lọc hiển thị
    const hienThiMon = kw ? danhSachMon : shuffleArray(danhSachMon).slice(0, 10);

    if (hienThiMon.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:gray">Không có dữ liệu</td></tr>';
    }

    hienThiMon.forEach(m => {
      const isThanhToan = m.thanhtoan === true;
      tbody.innerHTML += `
        <tr class="${isThanhToan ? 'tr-thanh-toan' : ''}">
          <td>
            <input type="checkbox"
                   onchange="tinhTongDaChon()"
                   data-id="${m._id}"
                   data-index="${m.index}">
          </td>
          <td>${m.ten}</td>
          <td>${m.ngay}</td>
          <td>${m.noidung}</td>
          <td>${m.soluong}</td>
          <td>${m.dongia.toLocaleString()}</td>
          <td>${(m.soluong * m.dongia).toLocaleString()}</td>
        </tr>`;
    });

    document.getElementById('tongCongRow').style.display = 'none';

  } catch (err) {
    console.error('Lỗi khi load data:', err);
    alert('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc máy chủ.');
  }
}

// Hàm xáo trộn mảng (Fisher-Yates shuffle)
function shuffleArray(array) {
  const arr = [...array]; // tránh thay đổi mảng gốc
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function convertNumberToWords(number) {
  const chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const hangDonVi = ['', 'nghìn', 'triệu', 'tỷ'];

  function docBaSo(num) {
    let [tram, chuc, donVi] = [
      Math.floor(num / 100),
      Math.floor((num % 100) / 10),
      num % 10
    ];
    let result = '';

    if (tram > 0) {
      result += chuSo[tram] + ' trăm';
      if (chuc === 0 && donVi !== 0) result += ' linh';
    }

    if (chuc > 1) {
      result += ' ' + chuSo[chuc] + ' mươi';
      if (donVi === 1) result += ' mốt';
      else if (donVi === 5) result += ' lăm';
      else if (donVi !== 0) result += ' ' + chuSo[donVi];
    } else if (chuc === 1) {
      result += ' mười';
      if (donVi === 5) result += ' lăm';
      else if (donVi !== 0) result += ' ' + chuSo[donVi];
    } else if (donVi !== 0 && chuc === 0) {
      result += ' ' + chuSo[donVi];
    }

    return result.trim();
  }

  if (number === 0) return 'Không đồng';

  let str = '';
  let i = 0;

  while (number > 0) {
    const num = number % 1000;
    if (num !== 0) {
      const temp = docBaSo(num);
      str = temp + ' ' + hangDonVi[i] + ' ' + str;
    }
    number = Math.floor(number / 1000);
    i++;
  }

  return str.trim().replace(/\s+/g, ' ') + ' đồng chẵn';
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

  const tienChu = convertNumberToWords(tongTien);
  const ngayIn = new Date(2025, 6, 2); // Ngày 2 tháng 7 năm 2025

  const printWindow = window.open('', '', 'width=900,height=600');
  printWindow.document.write(`<html><head><title>HÓA ĐƠN</title><style>
    body { font-family: Arial, sans-serif; margin: 20px; font-size: 13px; }
    .header-top{
                display:flex;          /* đặt logo + thông tin cùng hàng */
                align-items:center;    /* canh giữa theo chiều cao */
                gap:15px;              /* khoảng cách rất ngắn giữa logo và chữ */
                margin-bottom:10px;
                }
     .logo{
          flex:0 0 180px;        /* khung logo cố định rộng 140px */
          text-align:center;
          }
      .logo img{
                height:140px;          /* logo cao ~100px (vừa khung đỏ) */
                width:auto;            /* tự co theo tỉ lệ, không méo hình */
                display:block;
                }
    .company-info{
                flex:1;                /* chiếm hết phần còn lại */
                font-size:13px;
                line-height:1.5;
                }
    .company-info b { color: red; font-size: 16px; }
    .invoice-info { width: 28%; text-align: center; }
    .invoice-title { font-size: 18px; color: red; font-weight: bold; margin-bottom: 5px; }

    .center-title { text-align: center; font-size: 20px; color: red; font-weight: bold; margin: 20px 0 10px; }

    .info { margin-bottom: 5px; }
    .dotline { border-bottom: 1px dotted #000; width: 100%; display: inline-block; height: 12px; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid black; padding: 5px; text-align: center; }
    th { background-color: #f0f0f0; }

    .total-row td { font-weight: bold; text-align: right; }

    .sign {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
      font-size: 14px;
    }
    .sign div { text-align: center; width: 45%; }
    body::before{ 
    content:""; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) 
    rotate(-30deg); width:350px; height:350px;
    background:url('https://raw.githubusercontent.com/hiepdalat/minhchau/main/public/logomc.png')
    center/contain no-repeat; opacity:0.05; pointer-events:none; }
  </style></head><body>`);

  // PHẦN ĐẦU HÓA ĐƠN
  printWindow.document.write(`
    <div class="header-top">
      <div class="logo">
        <img src="https://raw.githubusercontent.com/hiepdalat/minhchau/main/public/logomc.png">
      </div>
      <div class="company-info">
        <b>Điện Nước Minh Châu</b><br>
        Mã số thuế: 8056681027-001<br>
        Địa chỉ: Chợ Xuân Thọ - Phường Xuân Trường - TP Đà Lạt<br>
        Điện thoại: 0973778279 - Zalo : 0938039084<br>
        Số tài khoản: 9973778279 – Ngân hàng Vietcombank - Dương Xuân Hiệp
      </div>
     
    </div>
    <div class="center-title">HÓA ĐƠN BÁN HÀNG</div><br>
     <div style="font-style: italic; text-align:center; margin-top:-10px; margin-bottom:10px;">
          Ngày ${ngayIn.getDate()} tháng ${ngayIn.getMonth() + 1} năm ${ngayIn.getFullYear()}
    </div>
  `);

  // PHẦN GIỮA
  printWindow.document.write(`
    <div class="info">Người mua hàng: <span class="dotline"></span></div>
    <div class="info">Địa chỉ: <span class="dotline"></span></div>

    <table>
      <tr>
        <th>STT</th>
        <th>Tên hàng hóa, dịch vụ</th>
        <th>Số lượng</th>
        <th>Đơn giá</th>
        <th>Thành tiền</th>
      </tr>
  `);

  printWindow.document.write(rows.join(''));
  printWindow.document.write(`
    <tr class="total-row">
      <td colspan="4">Tổng cộng hàng</td>
      <td>${tongTien.toLocaleString()}</td>
    </tr>
    </table>
    <div class="info">Số tiền viết bằng chữ: <b>${tienChu}</b></div>

    <div class="sign">
      <div>NGƯỜI MUA HÀNG<br><i>(Ký, ghi rõ họ tên)</i></div>
      <div>NGƯỜI BÁN HÀNG<br>Ngày 2 Tháng 7 Năm 2025<br><i>(Ký, ghi rõ họ tên)</i></div>
    </div>
  `);

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
