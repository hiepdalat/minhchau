// ===================== CẤU HÌNH =====================
const SESSION_IDLE_LIMIT = 5 * 60 * 1000;
let idleTimer;
let danhSachTam = [];

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        Swal.fire({
            icon: 'info',
            title: 'Phiên làm việc đã hết',
            text: 'Bạn đã không hoạt động quá 5 phút – vui lòng đăng nhập lại.',
        }).then(() => window.location.href = '/logout');
    }, SESSION_IDLE_LIMIT);
}
['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer));
resetIdleTimer();

// ===================== TICKER NGÀY =====================
(() => {
    const thuVN = ['Chủ nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];

    function buildText() {
        const d = new Date();
        return `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()} – Chúc bạn một ngày làm việc thật hiệu quả!`;
    }

    function alignTickerBox() {
        const logout = document.querySelector('.btn-logout');
        const box = document.getElementById('dateTicker');
        if (!logout || !box) return;
        const gap = window.innerWidth - logout.getBoundingClientRect().left;
        box.style.right = gap + 'px';
    }

    function startTicker() {
        const wrap = document.getElementById('tickerWrap');
        const box = document.getElementById('dateTicker');
        if (!wrap || !box) return;
        let boxW = box.clientWidth;
        let textW = wrap.clientWidth;
        let pos = boxW;
        const speed = 60;
        let last = performance.now();

        function loop(now) {
            const dt = (now - last) / 1000;
            last = now;
            pos -= speed * dt;
            while (pos <= -textW) pos += (textW + boxW);
            wrap.style.transform = `translateX(${pos}px)`;
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
        window.addEventListener('resize', () => {
            boxW = box.clientWidth;
            textW = wrap.clientWidth;
            if (pos <= -textW) pos = boxW;
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        const wrap = document.getElementById('tickerWrap');
        if (wrap) wrap.textContent = buildText();
        alignTickerBox();
        startTicker();
    });
    window.addEventListener('resize', alignTickerBox);
})();

// ===================== HỖ TRỢ ĐA TRANG =====================
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'congno') initCongNo();
    else if (page === 'khohang') initKhoHang?.();
    else if (page === 'banhang') initBanHang?.();
});

// ===================== MODULE: CÔNG NỢ =====================
let monTam = [];

function initCongNo() {
    console.log('🔁 Trang công nợ');

    const tbody = document.getElementById('ds');
    const btnTim = document.getElementById('btnTim');
    const inputTim = document.getElementById('timten');
    const inputND = document.getElementById('nd');
    const inputSL = document.getElementById('sl');
    const inputDG = document.getElementById('dg');
    const btnLuu = document.getElementById('btnLuu');

    let allData = [];

    inputTim.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnTim.click();
    });

    [inputND, inputSL, inputDG].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const nd = inputND.value.trim();
                const sl = +inputSL.value;
                const dg = +inputDG.value;

                if (!nd) return Swal.fire('⚠️ Thiếu nội dung', '', 'warning').then(() => inputND.focus());
                if (!sl || sl <= 0) return Swal.fire('⚠️ Thiếu số lượng', '', 'warning').then(() => inputSL.focus());
                if (dg < 0 || inputDG.value.trim() === '') return Swal.fire('⚠️ Thiếu đơn giá', '', 'warning').then(() => inputDG.focus());

                themMon();
            }
        });
    });

    function boDau(str) {
        return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    }

    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach((doc, docIndex) => {
            const ten = doc.ten || '';
            const ngay = doc.ngay || '';

            (doc.hanghoa || []).forEach((hh, index) => {
                const sl = parseFloat(hh.soluong) || 0;
                const gia = parseFloat(String(hh.dongia).toString().replace(/[.,]/g, '')) || 0;
                const tien = sl * gia;

                const tr = document.createElement('tr');
                if (hh.thanhtoan) {
                    tr.classList.add('row-paid');
                }
                tr.innerHTML = `
                    <td><input type="checkbox" data-id="${doc._id}" data-index="${index}"></td>
                    <td>${ten}</td>
                    <td>${ngay}</td>
                    <td>${hh.noidung || ''}</td>
                    <td>${sl}</td>
                    <td>${gia.toLocaleString()}</td>
                    <td>${tien.toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        });

        capNhatTongCong();

        const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(chk => {
            chk.addEventListener('change', capNhatTongCong);
        });
    }

    function getRandomRows(arr, n = 10) {
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
    }

    window.loadDataAndRender = function() {
        fetch('/api/congno')
            .then(res => res.json())
            .then(data => {
                allData = data;
                const keyword = boDau(inputTim.value.trim());
                if (!keyword) {
                    renderTable(getRandomRows(allData, 10));
                } else {
                    const matched = allData.filter(row => boDau(row.ten || '').includes(keyword));
                    renderTable(matched);
                }
            })
            .catch(err => {
                console.error('❌ Lỗi khi load công nợ:', err);
                tbody.innerHTML = '<tr><td colspan="7">Lỗi tải dữ liệu</td></tr>';
            });
    }

    // Bắt sự kiện khi click nút Tìm
    btnTim.onclick = loadDataAndRender;

    // Gọi hàm lưu và sau đó gọi lại loadDataAndRender
    document.getElementById('btnLuu')?.addEventListener('click', () => {
        luuTatCa(() => {
            Swal.fire('✅ Đã lưu công nợ', '', 'success');
            monTam = [];
            renderTam();
            loadDataAndRender();
        });
    });

    // Sự kiện chọn tất cả checkbox
    document.getElementById('checkAll')?.addEventListener('change', function() {
        chonTatCa(this);
    });
    document.getElementById('btnXoa')?.addEventListener('click', xoaDaChon);
    document.getElementById('btnThanhToan')?.addEventListener('click', thanhToan);
    document.getElementById('btnIn')?.addEventListener('click', inDanhSach); // Gán sự kiện inDanhSach
    document.getElementById('btnThem')?.addEventListener('click', themMon);

    loadDataAndRender();
}

function chonTatCa(checkbox) {
    document.querySelectorAll('#ds input[type="checkbox"]').forEach(chk => {
        chk.checked = checkbox.checked;
        chk.dispatchEvent(new Event('change'));
    });
}

function dangXuat() {
    fetch('/logout').then(() => location.href = '/index.html');
}

function themMon() {
    const noidung = document.getElementById('nd')?.value.trim();
    const soluong = parseFloat(document.getElementById('sl')?.value) || 0;
    const dongia = parseFloat(document.getElementById('dg')?.value) || 0;

    if (!noidung || soluong <= 0 || dongia <= 0) {
        Swal.fire('❌ Thiếu hoặc sai thông tin', '', 'warning');
        return;
    }

    monTam.push({
        noidung,
        soluong,
        dongia
    });
    renderTam();

    document.getElementById('nd').value = '';
    document.getElementById('sl').value = '';
    document.getElementById('dg').value = '';
    // 👉 Tự động focus lại ô nội dung để nhập tiếp
    document.getElementById('nd').focus();
}

function renderTam() {
    const box = document.getElementById('monTamBox');
    const tb = document.getElementById('bangTam');
    tb.innerHTML = '';

    if (monTam.length === 0) return box.style.display = 'none';
    box.style.display = '';

    monTam.forEach((m, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.noidung}</td>
            <td>${m.soluong}</td>
            <td>${m.dongia}</td>
            <td>${(m.soluong * m.dongia).toLocaleString()}</td>
            <td><button onclick="xoaMon(${i})">❌</button></td>
        `;
        tb.appendChild(tr);
    });
}

function xoaMon(i) {
    monTam.splice(i, 1);
    renderTam();
}

function luuTatCa(callback) {
    const ten = document.getElementById('ten')?.value.trim();
    const ngay = document.getElementById('ngay')?.value.trim();

    if (!ten || !ngay || monTam.length === 0) {
        Swal.fire('⚠️ Thiếu thông tin hoặc chưa có món nào', '', 'warning');
        return;
    }

    fetch('/them', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ten,
                ngay,
                hanghoa: monTam
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (typeof callback === 'function') callback();
            } else {
                Swal.fire('❌ Lưu thất bại', '', 'error');
            }
        })
        .catch(err => {
            console.error('❌ Lỗi khi lưu:', err);
            Swal.fire('❌ Không thể kết nối máy chủ', '', 'error');
        });
}

function xoaDaChon() {
    const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    if (chks.length === 0) return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');

    Swal.fire({
        title: 'Xoá các dòng đã chọn?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ'
    }).then(result => {
        if (!result.isConfirmed) return;
        const reqs = Array.from(chks).map(chk => {
            return fetch('/xoa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: chk.dataset.id,
                    index: chk.dataset.index
                })
            });
        });
        Promise.all(reqs).then(() => loadDataAndRender());
    });
}

function thanhToan() {
    const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    if (chks.length === 0)
        return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');

    // Kiểm tra nếu có dòng nào đã thanh toán
    const daThanhToan = Array.from(chks).some(chk => {
        const row = chk.closest('tr');
        return row.classList.contains('row-paid');
    });

    if (daThanhToan) {
        Swal.fire('❌ Khách này đã được thanh toán trước đó!', 'Vui lòng bỏ chọn các dòng đã thanh toán.', 'error');
        return;
    }

    Swal.fire({
        title: 'Xác nhận thanh toán cho khách?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Huỷ'
    }).then(result => {
        if (!result.isConfirmed) return;

        const reqs = Array.from(chks).map(chk => {
            return fetch('/thanhtoan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: chk.dataset.id,
                    index: chk.dataset.index
                })
            });
        });

        Promise.all(reqs).then(() => {
            loadDataAndRender(); // Load lại bảng sau thanh toán
            setTimeout(() => inDanhSach(), 500); // In danh sách sau khi đã cập nhật DOM
        });
    });
}

function loadData() {
    return fetch('/api/congno')
        .then(res => res.json())
        .then(data => {
            allData = data;
            renderTable(getRandomRows(allData, 10));
            return data;
        });
}

function inDanhSach() {
    const rows = [];
    let stt = 1;
    let tong = 0;
    let tenKhachHang = ''; // <-- Biến để lưu tên khách hàng

    const checkedRows = document.querySelectorAll('#ds input[type="checkbox"]:checked');

    if (checkedRows.length === 0) {
        Swal.fire('⚠️ Vui lòng chọn ít nhất 1 dòng để in hóa đơn', '', 'warning');
        return;
    }

    // Lấy tên khách hàng từ dòng đầu tiên được chọn
    const firstCheckedRow = checkedRows[0].closest('tr');
    if (firstCheckedRow) {
        tenKhachHang = firstCheckedRow.querySelectorAll('td')[1]?.innerText.trim() || '';
    }

    // Kiểm tra nếu có nhiều khách hàng được chọn
    let conflictCustomers = false;
    for (const chk of checkedRows) {
        const tr = chk.closest('tr');
        const currentCustomerName = tr.querySelectorAll('td')[1]?.innerText.trim() || '';
        if (tenKhachHang && currentCustomerName !== tenKhachHang) {
            conflictCustomers = true;
            break;
        }
    }

    if (conflictCustomers) {
        Swal.fire('⚠️ Lỗi: Không thể in hóa đơn cho nhiều khách hàng khác nhau cùng lúc.', 'Vui lòng chỉ chọn các mục của một khách hàng.', 'warning');
        return;
    }


    checkedRows.forEach(chk => {
        const tr = chk.closest('tr');
        const cells = tr.querySelectorAll('td');
        const noidung = cells[3].innerText;
        const sl = cells[4].innerText;
        const dongiaStr = cells[5].innerText;
        const dongia = parseFloat(dongiaStr.replace(/\./g, '').replace(/,/g, '')) || 0;
        const thanhtien = dongia * parseFloat(sl) || 0;
        tong += thanhtien;
        rows.push(`
            <tr>
                <td>${stt++}</td>
                <td>${noidung}</td>
                <td>${sl}</td>
                <td>${dongia.toLocaleString()}</td>
                <td>${thanhtien.toLocaleString()}</td>
            </tr>
        `);
    });

    function numberToVietnamese(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'Số không hợp lệ';
        if (number === 0) return 'Không đồng chẵn';

        const dv = ['đồng', 'nghìn', 'triệu', 'tỷ'];
        const so = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

        function doc3so(n, dayDu = false, laDauTien = false) {
            let [tram, chuc, donvi] = [
                Math.floor(n / 100),
                Math.floor((n % 100) / 10),
                n % 10
            ];
            let ketQua = '';

            // Không đọc "không trăm" ở nhóm đầu tiên
            if (tram > 0 || (!laDauTien && dayDu)) {
                ketQua += so[tram] + ' trăm';
                if (chuc === 0 && donvi > 0) ketQua += ' lẻ';
            } else if (chuc === 0 && donvi > 0 && !laDauTien) {
                ketQua += ' lẻ';
            }

            if (chuc > 1) {
                ketQua += ' ' + so[chuc] + ' mươi';
                if (donvi === 1) ketQua += ' mốt';
                else if (donvi === 5) ketQua += ' lăm';
                else if (donvi > 0) ketQua += ' ' + so[donvi];
            } else if (chuc === 1) {
                ketQua += ' mười';
                if (donvi === 5) ketQua += ' lăm';
                else if (donvi > 0) ketQua += ' ' + so[donvi];
            } else if (donvi > 0 && chuc === 0) {
                ketQua += ' ' + so[donvi];
            }

            return ketQua.trim();
        }

        const parts = [];
        let tempNumber = Math.abs(number); // Đảm bảo xử lý số dương
        while (tempNumber > 0) {
            parts.push(tempNumber % 1000);
            tempNumber = Math.floor(tempNumber / 1000);
        }

        if (parts.length === 0) return 'Không đồng chẵn'; // Trường hợp số 0

        let chu = '';
        for (let i = parts.length - 1; i >= 0; i--) {
            if (parts[i] !== 0) {
                const laDau = (i === parts.length - 1);
                const phan = doc3so(parts[i], i !== parts.length - 1, laDau);
                chu += phan + ' ' + dv[i] + ' ';
            } else if (i === 0 && chu !== '') {
                // Xử lý trường hợp "không đồng" nếu chỉ có nhóm cuối cùng là 0
                // Ví dụ: 1.000.000 -> "Một triệu đồng chẵn"
                // 1.000.001 -> "Một triệu không trăm lẻ một đồng chẵn"
                if (parts.length === 1 && parts[0] === 0) {
                    // Do đã kiểm tra ở đầu hàm, trường hợp này sẽ không xảy ra
                } else if (i === 0 && (chu.endsWith('triệu ') || chu.endsWith('tỷ '))) {
                     // Nếu nhóm trước đó là triệu/tỷ và nhóm này là 0, thêm đơn vị đồng
                    chu += dv[i] + ' ';
                }
            }
        }

        chu = chu.trim().replace(/\s+/g, ' ');
        // Thêm "âm" nếu số ban đầu là âm
        if (number < 0) {
            chu = 'Âm ' + chu;
        }
        return chu.charAt(0).toUpperCase() + chu.slice(1) + ' chẵn';
    }


    const ngayIn = new Date().toLocaleDateString('vi-VN');
    const chu = numberToVietnamese(tong);
    const logoURL = 'https://raw.githubusercontent.com/hiepdalat/minhchau/main/public/logomc.png';

    // Tự động điều chỉnh size watermark
    const watermarkSize = rows.length <= 5 ? 260 :
        rows.length <= 10 ? 350 :
        rows.length <= 20 ? 300 : 360;

    const html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Hóa đơn bán hàng</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    color: #000;
                    position: relative;
                }

                .header {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 8px;
                }

                .header img {
                    height: 120px;
                    margin-right: 8px;
                }

                .company-info {
                    font-size: 14px;
                    line-height: 1.5;
                }

                .company-info h1 {
                    margin: 0;
                    color: #d00;
                    font-size: 20px;
                }

                h2 {
                    text-align: center;
                    color: red;
                    margin: 10px 0 4px 0;
                    font-size: 20px;
                }

                .info div {
                    margin: 6px 0;
                }

                .dots-line {
                    border-bottom: 1px dotted #000;
                    display: inline-block;
                    width: 85%;
                    margin-left: 10px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 16px;
                }

                th, td {
                    border: 1px solid #000;
                    padding: 6px;
                    text-align: center;
                    font-size: 14px;
                }

                tfoot td {
                    font-weight: bold;
                }

                .amount-text {
                    margin-top: 16px;
                    font-style: italic;
                }

                .sign {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                }

                .sign div {
                    text-align: center;
                }

                .table-container {
                    position: relative;
                }

                .watermark-inside {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-20deg);
                    opacity: 0.3;
                    pointer-events: none;
                    z-index: 0;
                }

                .watermark-inside img {
                    width: 220px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoURL}" alt="Logo">
                <div class="company-info">
                    <h1>Điện Nước Minh Châu</h1>
                    <div>MST: 8056681027-001</div>
                    <div>Chợ Xuân Thọ – P. Xuân Trường – TP Đà Lạt</div>
                    <div>ĐT: 0973778279 – Zalo: 0938039084</div>
                    <div>STK: 9973778279 – Vietcomcombank – Dương Xuân Hiệp</div>
                </div>
            </div>

            <h2>HÓA ĐƠN BÁN HÀNG</h2>
            <div style="text-align: center; font-size: 14px; color: #000; margin-top: -8px;">
                Ngày: ${ngayIn}
            </div>

            <div class="info">
                <div><strong>Người mua hàng:</strong><span class="dots-line">${tenKhachHang}</span></div>
                <div><strong>Địa chỉ:</strong><span class="dots-line"></span></div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên hàng hóa, dịch vụ</th>
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
                            <td colspan="4">Tổng cộng</td>
                            <td>${tong.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="watermark-inside">
                    <img src="${logoURL}" alt="Watermark">
                </div>
            </div>
            <div class="amount-text">Số tiền viết bằng chữ: ${chu}</div>

            <div class="sign">
                <div>
                    NGƯỜI MUA HÀNG<br>(Ký, ghi rõ họ tên)
                </div>
                <div>
                    NGƯỜI BÁN HÀNG<br>Ngày ${ngayIn}<br>(Ký, ghi rõ họ tên)
                </div>
            </div>

            <script>window.print();</script>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

function capNhatTongCong() {
    const checkboxes = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    let tong = 0;

    checkboxes.forEach(chk => {
        const tr = chk.closest('tr');
        const cells = tr.querySelectorAll('td');
        const thanhTien = parseFloat(cells[6]?.innerText?.replace(/\./g, '').replace(/,/g, '') || '0');

        tong += thanhTien;
    });

    const tongRow = document.getElementById('tongCongRow');
    const tongVal = document.getElementById('tongCongValue');
    if (tongVal) { // Kiểm tra để tránh lỗi nếu phần tử không tồn tại trên trang
        tongVal.textContent = tong.toLocaleString();
    }
    if (tongRow) { // Kiểm tra để tránh lỗi nếu phần tử không tồn tại trên trang
        tongRow.style.display = checkboxes.length > 0 ? '' : 'none';
    }
}


// ===================== MODULE: NHẬP HÀNG =====================
function initNhapHang() {
    console.log('🔁 Trang nhập hàng');

    document.getElementById('btnThemHang')?.addEventListener('click', () => {
        const maHang = document.getElementById('maHang').value.trim();
        const tenHang = document.getElementById('tenHang').value.trim();
        const soLuong = parseFloat(document.getElementById('soLuongNhap').value);
        const donGia = parseFloat(document.getElementById('donGiaNhap').value);

        if (!maHang || !tenHang || isNaN(soLuong) || isNaN(donGia)) {
            Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin hàng hóa', 'warning');
            return;
        }

        fetch('/api/kho/nhap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    maHang,
                    tenHang,
                    soLuong,
                    donGia
                })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire('Thành công', data.message || 'Đã nhập hàng thành công!', 'success');
                document.getElementById('maHang').value = '';
                document.getElementById('tenHang').value = '';
                document.getElementById('soLuongNhap').value = '';
                document.getElementById('donGiaNhap').value = '';
                taiDanhSachKho();
            });
    });

    window.addEventListener('load', () => {
        taiDanhSachKho();
    });
}

function taiDanhSachKho() {
    fetch('/api/kho')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('bangKho');
            if (!tbody) return;
            tbody.innerHTML = '';
            data.forEach((item, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${item.maHang}</td>
                    <td>${item.tenHang}</td>
                    <td>${item.soLuong}</td>
                    <td>${item.donGia}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ===================== MODULE: BÁN HÀNG =====================
function initBanHang() {
    console.log('🔁 Trang bán hàng');

    document.getElementById('btnThemBan')?.addEventListener('click', () => {
        const tenKhach = document.getElementById('tenKhachBan').value.trim();
        const noiDung = document.getElementById('noiDungBan').value.trim();
        const soLuong = parseFloat(document.getElementById('soLuongBan').value);
        const donGia = parseFloat(document.getElementById('donGiaBan').value);

        if (!tenKhach || !noiDung || isNaN(soLuong) || isNaN(donGia)) {
            Swal.fire('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường', 'warning');
            return;
        }

        const thanhTien = soLuong * donGia;
        const ngay = new Date().toISOString().slice(0, 10);

        fetch('/api/congno/ban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenKhach,
                    ngay,
                    noiDung,
                    soLuong,
                    donGia,
                    thanhTien
                })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire('Thành công', data.message || 'Đã lưu đơn hàng bán', 'success');
                document.getElementById('noiDungBan').value = '';
                document.getElementById('soLuongBan').value = '';
                document.getElementById('donGiaBan').value = '';
                taiLichSuBan();
            });
    });

    window.addEventListener('load', () => {
        taiLichSuBan();
    });
}

function taiLichSuBan() {
    fetch('/api/congno')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('lichSuBan');
            if (!tbody) return;
            tbody.innerHTML = '';
            // Lấy 10 mục cuối cùng và đảo ngược để hiển thị mới nhất lên đầu
            data.filter(d => !d.thanhtoan).slice(-10).reverse().forEach((item, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${item.ten || ''}</td> <td>${item.hanghoa?.[0]?.noidung || ''}</td> <td>${item.hanghoa?.[0]?.soluong || ''}</td> <td>${item.hanghoa?.[0]?.dongia || ''}</td> <td>${(item.hanghoa?.[0]?.soluong * item.hanghoa?.[0]?.dongia)?.toLocaleString() || ''}</td> <td>${item.ngay?.slice(0,10) || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}
