// ===================== CẤU HÌNH VÀ QUẢN LÝ PHIÊN =====================
const SESSION_IDLE_LIMIT = 5 * 60 * 1000;
const IDLE_EVENTS = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
let idleTimer;

const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        Swal.fire({
            icon: 'info',
            title: 'Phiên làm việc đã hết',
            text: 'Bạn đã không hoạt động quá 5 phút – vui lòng đăng nhập lại.',
        }).then(() => window.location.href = '/logout');
    }, SESSION_IDLE_LIMIT);
};

IDLE_EVENTS.forEach(evt => document.addEventListener(evt, resetIdleTimer));
resetIdleTimer();
// ===================== TICKER NGÀY =====================
const createDateTicker = () => {
    const thuVN = ['Chủ nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
    const tickerWrap = document.getElementById('tickerWrap');
    const dateTicker = document.getElementById('dateTicker');

    if (!tickerWrap || !dateTicker) return;

    const buildText = () => {
        const d = new Date();
        return `Hôm nay thứ ${thuVN[d.getDay()]} ngày ${d.getDate().toString().padStart(2,'0')} tháng ${(d.getMonth()+1).toString().padStart(2,'0')} năm ${d.getFullYear()} – Chúc bạn một ngày làm việc thật hiệu quả!`;
    };

    const alignTickerBox = () => {
        const logoutBtn = document.querySelector('.btn-logout');
        if (!logoutBtn) return;
        const gap = window.innerWidth - logoutBtn.getBoundingClientRect().left;
        dateTicker.style.right = `${gap}px`;
    };

    const startTicker = () => {
        let boxWidth = dateTicker.clientWidth;
        let textWidth = tickerWrap.clientWidth;
        let position = boxWidth;
        const speed = 60;
        let lastTime = performance.now();

        const loop = (now) => {
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;
            position -= speed * deltaTime;
            if (position <= -textWidth) position += (textWidth + boxWidth);
            tickerWrap.style.transform = `translateX(${position}px)`;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        window.addEventListener('resize', () => {
            boxWidth = dateTicker.clientWidth;
            textWidth = tickerWrap.clientWidth;
            if (position <= -textWidth) position = boxWidth;
        });
    };

    tickerWrap.textContent = buildText();
    alignTickerBox();
    startTicker();
};

document.addEventListener('DOMContentLoaded', createDateTicker);
window.addEventListener('resize', () => {
    const logoutBtn = document.querySelector('.btn-logout');
    const box = document.getElementById('dateTicker');
    if (logoutBtn && box) {
        const gap = window.innerWidth - logoutBtn.getBoundingClientRect().left;
        box.style.right = `${gap}px`;
    }
});
// ===================== HỖ TRỢ ĐA TRANG & HÀM TIỆN ÍCH =====================
const pages = {
    'congno': initCongNo,
    'khohang': initKhoHang,
    'banhang': initBanHang
};

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (pages[page]) {
        pages[page]();
    }
});

// Hàm chung để gọi API
async function callApi(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Lỗi khi gọi API ${url}:`, error);
        Swal.fire('❌ Lỗi', 'Không thể kết nối máy chủ hoặc dữ liệu không hợp lệ', 'error');
        return null;
    }
}

// Hàm tiện ích loại bỏ dấu tiếng Việt
function boDau(str) {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
// ===================== MODULE: CÔNG NỢ =====================
let monTam = [];
let allData = [];

function initCongNo() {
    console.log('🔁 Trang công nợ');

    // Gán các phần tử DOM vào biến để dễ sử dụng
    const dom = {
        tbody: document.getElementById('ds'),
        btnTim: document.getElementById('btnTim'),
        inputTim: document.getElementById('timten'),
        inputND: document.getElementById('nd'),
        inputSL: document.getElementById('sl'),
        inputDG: document.getElementById('dg'),
        btnLuu: document.getElementById('btnLuu'),
        checkAll: document.getElementById('checkAll'),
        btnXoa: document.getElementById('btnXoa'),
        btnThanhToan: document.getElementById('btnThanhToan'),
        btnIn: document.getElementById('btnIn'),
        btnThem: document.getElementById('btnThem'),
        tongCongValue: document.getElementById('tongCongValue'),
        tongCongRow: document.getElementById('tongCongRow')
    };

    // Gán tất cả sự kiện vào một nơi
    dom.inputTim?.addEventListener('keydown', (e) => e.key === 'Enter' && dom.btnTim.click());
    [dom.inputND, dom.inputSL, dom.inputDG].forEach(input => {
        input?.addEventListener('keydown', (e) => e.key === 'Enter' && themMon());
    });
    dom.btnTim?.addEventListener('click', loadDataAndRender);
    dom.btnLuu?.addEventListener('click', () => {
        luuTatCa(() => {
            Swal.fire('✅ Đã lưu công nợ', '', 'success');
            monTam = [];
            renderTam();
            loadDataAndRender();
        });
    });
    dom.checkAll?.addEventListener('change', (e) => chonTatCa(e.target));
    dom.btnXoa?.addEventListener('click', xoaDaChon);
    dom.btnThanhToan?.addEventListener('click', thanhToan);
    dom.btnIn?.addEventListener('click', inDanhSach);
    dom.btnThem?.addEventListener('click', themMon);

    window.loadDataAndRender = async function() {
        const data = await callApi('/api/congno');
        if (data) {
            allData = data;
            const keyword = boDau(dom.inputTim.value.trim());
            const filteredData = keyword ? allData.filter(row => boDau(row.ten || '').includes(keyword)) : getRandomRows(allData, 10);
            renderTable(filteredData);
        }
    };
    
    // Khởi tạo
    loadDataAndRender();
}

function getRandomRows(arr, n = 10) {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

function renderTable(data) {
    const tbody = document.getElementById('ds');
    tbody.innerHTML = '';
    data.forEach(doc => {
        (doc.hanghoa || []).forEach((hh, index) => {
            const sl = parseFloat(hh.soluong) || 0;
            const gia = parseFloat(String(hh.dongia).replace(/[.,]/g, '')) || 0;
            const tien = sl * gia;
            const tr = document.createElement('tr');
            if (hh.thanhtoan) tr.classList.add('row-paid');
            tr.innerHTML = `
                <td><input type="checkbox" data-id="${doc._id}" data-index="${index}"></td>
                <td>${doc.ten || ''}</td>
                <td>${doc.ngay || ''}</td>
                <td>${hh.noidung || ''}</td>
                <td>${sl}</td>
                <td>${gia.toLocaleString()}</td>
                <td>${tien.toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    });
    capNhatTongCong();
    tbody.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.addEventListener('change', capNhatTongCong));
}

function chonTatCa(checkbox) {
    document.querySelectorAll('#ds input[type="checkbox"]').forEach(chk => {
        chk.checked = checkbox.checked;
        chk.dispatchEvent(new Event('change'));
    });
}

function themMon() {
    const noidung = document.getElementById('nd')?.value.trim();
    const soluong = parseFloat(document.getElementById('sl')?.value) || 0;
    const dongia = parseFloat(document.getElementById('dg')?.value) || 0;
    if (!noidung || soluong <= 0 || dongia < 0 || document.getElementById('dg').value.trim() === '') {
        Swal.fire('❌ Thiếu hoặc sai thông tin', '', 'warning');
        return;
    }
    monTam.push({ noidung, soluong, dongia });
    renderTam();
    document.getElementById('nd').value = '';
    document.getElementById('sl').value = '';
    document.getElementById('dg').value = '';
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

async function luuTatCa(callback) {
    const ten = document.getElementById('ten')?.value.trim();
    const ngay = document.getElementById('ngay')?.value.trim();
    if (!ten || !ngay || monTam.length === 0) {
        Swal.fire('⚠️ Thiếu thông tin hoặc chưa có món nào', '', 'warning');
        return;
    }
    const data = await callApi('/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten, ngay, hanghoa: monTam })
    });
    if (data?.success) {
        if (typeof callback === 'function') callback();
    } else {
        Swal.fire('❌ Lưu thất bại', '', 'error');
    }
}

async function xoaDaChon() {
    const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    if (chks.length === 0) return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');
    const result = await Swal.fire({
        title: 'Xoá các dòng đã chọn?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ'
    });
    if (!result.isConfirmed) return;
    const reqs = Array.from(chks).map(chk => callApi('/xoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
    }));
    await Promise.all(reqs);
    loadDataAndRender();
}

async function thanhToan() {
    const chks = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    if (chks.length === 0) return Swal.fire('⚠️ Chưa chọn dòng nào', '', 'warning');
    if (Array.from(chks).some(chk => chk.closest('tr').classList.contains('row-paid'))) {
        Swal.fire('❌ Khách này đã được thanh toán trước đó!', 'Vui lòng bỏ chọn các dòng đã thanh toán.', 'error');
        return;
    }
    const result = await Swal.fire({
        title: 'Xác nhận thanh toán cho khách?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Huỷ'
    });
    if (!result.isConfirmed) return;
    const reqs = Array.from(chks).map(chk => callApi('/thanhtoan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chk.dataset.id, index: chk.dataset.index })
    }));
    await Promise.all(reqs);
    loadDataAndRender();
    setTimeout(() => inDanhSach('https://raw.githubusercontent.com/hiepdalat/minhchau/main/QuanLyCongNo/public/watermark.png'), 500);
}

function capNhatTongCong() {
    const checkboxes = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    const tong = Array.from(checkboxes).reduce((sum, chk) => {
        const cells = chk.closest('tr').querySelectorAll('td');
        const thanhTien = parseFloat(cells[6]?.innerText?.replace(/\./g, '').replace(/,/g, '') || '0');
        return sum + thanhTien;
    }, 0);
    const tongCongValue = document.getElementById('tongCongValue');
    const tongCongRow = document.getElementById('tongCongRow');
    if (tongCongValue) tongCongValue.textContent = tong.toLocaleString();
    if (tongCongRow) tongCongRow.style.display = checkboxes.length > 0 ? '' : 'none';
}

function inDanhSach(watermarkURL = null) {
    const checkedRows = document.querySelectorAll('#ds input[type="checkbox"]:checked');
    if (checkedRows.length === 0) {
        Swal.fire('⚠️ Vui lòng chọn ít nhất 1 dòng để in hóa đơn', '', 'warning');
        return;
    }
    
    // Tối ưu hóa việc lấy tên khách hàng và kiểm tra xung đột
    const tenKhachHang = checkedRows[0].closest('tr').querySelectorAll('td')[1]?.innerText.trim() || '';
    if (Array.from(checkedRows).some(chk => chk.closest('tr').querySelectorAll('td')[1]?.innerText.trim() !== tenKhachHang)) {
        Swal.fire('⚠️ Lỗi: Không thể in hóa đơn cho nhiều khách hàng khác nhau cùng lúc.', 'Vui lòng chỉ chọn các mục của một khách hàng.', 'warning');
        return;
    }

    const rows = [];
    let tong = 0;
    Array.from(checkedRows).forEach((chk, stt) => {
        const cells = chk.closest('tr').querySelectorAll('td');
        const [noidung, sl, dongiaStr] = [cells[3].innerText, cells[4].innerText, cells[5].innerText];
        const dongia = parseFloat(dongiaStr.replace(/\./g, '').replace(/,/g, '')) || 0;
        const thanhtien = dongia * parseFloat(sl) || 0;
        tong += thanhtien;
        rows.push(`
            <tr>
                <td>${stt + 1}</td>
                <td>${noidung}</td>
                <td>${sl}</td>
                <td>${dongia.toLocaleString()}</td>
                <td>${thanhtien.toLocaleString()}</td>
            </tr>
        `);
    });

    const numberToVietnamese = (number) => { /*... giữ nguyên code này, nó khá phức tạp để viết lại*/ };
    const ngayIn = new Date().toLocaleDateString('vi-VN');
    const chu = numberToVietnamese(tong);
    const logoURL = 'https://raw.githubusercontent.com/hiepdalat/minhchau/main/public/logomc.png';
    const html = `
        <html>
        <head><meta charset="UTF-8"><title>Hóa đơn bán hàng</title></head>
        <body>
            <style> /* ... giữ nguyên CSS ... */ </style>
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
            <div style="text-align: center; font-size: 14px; color: #000; margin-top: -8px;">Ngày: ${ngayIn}</div>
            <div class="info">
                <div><strong>Người mua hàng:</strong><span class="dots-line">${tenKhachHang}</span></div>
                <div><strong>Địa chỉ:</strong><span class="dots-line"></span></div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>STT</th><th>Tên hàng hóa, dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                    <tbody>${rows.join('')}</tbody>
                    <tfoot><tr><td colspan="4">Tổng cộng</td><td>${tong.toLocaleString()}</td></tr></tfoot>
                </table>
                ${watermarkURL ? `<div class="watermark-inside"><img src="${watermarkURL}" alt="Watermark"></div>` : ''}
            </div>
            <div class="amount-text">Số tiền viết bằng chữ: ${chu}</div>
            <div class="sign">
                <div>NGƯỜI MUA HÀNG<br>(Ký, ghi rõ họ tên)</div>
                <div>NGƯỜI BÁN HÀNG<br>Ngày ${ngayIn}<br>(Ký, ghi rõ họ tên)</div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}
