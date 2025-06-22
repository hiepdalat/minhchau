let danhSachTam = [];

function dangXuat() {
  window.location.href = "index.html";
}

function themMon() {
  const nd = document.getElementById('nd').value.trim();
  const sl = parseInt(document.getElementById('sl').value);
  const dg = parseInt(document.getElementById('dg').value);
  if (!nd || isNaN(sl) || sl <= 0 || isNaN(dg) || dg < 0) {
    alert("Vui lòng nhập đúng nội dung, số lượng, đơn giá");
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
  danhSachTam.forEach((m, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${m.nd}</td>
        <td>${m.sl}</td>
        <td>${m.dg.toLocaleString()}</td>
        <td>${(m.sl * m.dg).toLocaleString()}</td>
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
    alert("Nhập tên, ngày, ít nhất 1 món!");
    return;
  }

  const res = await fetch('/api/congno', {
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
    alert("Lưu thất bại");
  }
}

async function loadData(keyword = '') {
  const res = await fetch('/api/congno?ten=' + encodeURIComponent(keyword));
  const data = await res.json();
  const tbody = document.getElementById('ds');
  tbody.innerHTML = '';
  data.forEach((r, i) => {
    r.hanghoa.forEach((m, j) => {
      tbody.innerHTML += `
        <tr>
          <td><input type="checkbox" class="chon-xoa" data-khach="${i}" data-mon="${j}" onchange="tinhTongDaChon()"></td>
          <td>${r.ten}</td>
          <td>${r.ngay}</td>
          <td>${m.nd}</td>
          <td>${m.sl}</td>
          <td>${m.dg.toLocaleString()}</td>
          <td>${(m.sl * m.dg).toLocaleString()}</td>
        </tr>`;
    });
  });
  document.getElementById('tongCongRow').style.display = 'none';
}

async function xoaDaChon() {
  let data = await (await fetch('/api/congno')).json();
  const checks = document.querySelectorAll('.chon-xoa:checked');
  if (!checks.length) return alert("Chọn ít nhất 1 dòng!");
  const xoa = [];
  checks.forEach(chk => xoa.push({
    khach: +chk.dataset.khach,
    mon: +chk.dataset.mon
  }));
  xoa.sort((a, b) => b.khach - a.khach || b.mon - a.mon);
  xoa.forEach(x => {
    data[x.khach].hanghoa.splice(x.mon, 1);
    if (data[x.khach].hanghoa.length === 0) data.splice(x.khach, 1);
  });
  await fetch('/api/congno/saveall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  loadData();
}

function tinhTongDaChon() {
  const checks = document.querySelectorAll('.chon-xoa:checked');
  if (!checks.length) return document.getElementById('tongCongRow').style.display = 'none';
  let tong = 0;
  checks.forEach(chk => {
    tong += parseInt(chk.closest('tr').lastElementChild.textContent.replace(/\./g, ''));
  });
  document.getElementById('tongCongValue').textContent = tong.toLocaleString();
  document.getElementById('tongCongRow').style.display = '';
}

document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    loadData(e.target.value.trim());
    e.preventDefault();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const nd = document.getElementById('nd').value.trim();
    const sl = parseInt(document.getElementById('sl').value);
    const dg = parseInt(document.getElementById('dg').value);
    if (nd && sl > 0 && dg >= 0) {
      themMon();
      e.preventDefault();
    }
  }
});
window.onload = () => loadData();
