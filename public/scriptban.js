// scriptban.js – xử lý bán hàng + in hóa đơn theo mẫu công nợ

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const customerInput = $('customer');
  const saleDateInput = $('saleDate');
  const productInput  = $('product');
  const unitInput     = $('unit');
  const qtyInput      = $('qty');
  const priceInput    = $('price');
  const addItemBtn    = $('addItem');
  const printBtn      = $('printBtn');
  const detailBtn     = $('detailBtn');
  const logoutBtn     = $('logoutBtn');
  const stockInfo     = $('stockInfo');
  const tableBody     = document.querySelector('#itemsTable tbody');
  const grandTotalCell= $('grandTotal');

  /* ================== DỮ LIỆU ================== */
  let products = [];
  let cart     = [];

  saleDateInput.valueAsDate = new Date();

  fetch('/api/products/stock')
    .then(r=>r.json())
    .then(data=>{
      products = data;
      const datalist = document.getElementById('productList');
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        datalist.appendChild(opt);
      });
    });

  /* ================== HÀM PHỤ ================== */
  function renderTable(){
    tableBody.innerHTML='';
    if(cart.length===0){
      tableBody.innerHTML='<tr id="noData"><td colspan="7">Chưa có mặt hàng</td></tr>';
      grandTotalCell.textContent='0';
      return;
    }
    let total = 0;
    cart.forEach((row, idx) => {
      const sub = row.price * row.qty;
      total += sub;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${row.name}</td>
        <td>${row.unit}</td>
        <td>${row.qty}</td>
        <td>${row.price.toLocaleString()}</td>
        <td>${sub.toLocaleString()}</td>
        <td><button class="btn btn-danger btn-sm" data-idx="${idx}"><i class="fa fa-trash"></i></button></td>`;
      tableBody.appendChild(tr);
    });
    grandTotalCell.textContent = total.toLocaleString();
  }

  function currency(n){return n.toLocaleString('vi-VN');}

  /* ================== SỰ KIỆN ================== */
  productInput.addEventListener('input', () => {
    const p = products.find(x => x.name === productInput.value.trim());
    if(p){
      unitInput.value  = p.unit;
      priceInput.value = p.price;
      stockInfo.textContent = `(Tồn: ${p.qty_on_hand})`;
    } else stockInfo.textContent='';
  });

  addItemBtn.addEventListener('click', () => {
    const name = productInput.value.trim();
    const prod = products.find(x => x.name === name);
    if(!prod){ alert('Sản phẩm không hợp lệ'); return; }

    const qty = +qtyInput.value;
    if(qty<=0 || qty>prod.qty_on_hand){ alert(`Tồn kho không đủ (còn ${prod.qty_on_hand})`); return; }

    prod.qty_on_hand -= qty;
    cart.push({ code: prod.code, name: prod.name, unit: prod.unit, qty, price: +priceInput.value });

    productInput.value = unitInput.value = '';
    qtyInput.value = 1; priceInput.value = 0; stockInfo.textContent='';
    renderTable();
  });

  tableBody.addEventListener('click', e=>{
    const btn=e.target.closest('button[data-idx]');
    if(!btn) return;
    const idx=+btn.dataset.idx;
    const removed=cart.splice(idx,1)[0];
    const p=products.find(x=>x.name===removed.name);
    if(p) p.qty_on_hand+=removed.qty;
    renderTable();
  });

  /* ====== IN THEO MẪU HÓA ĐƠN CÔNG NỢ ====== */
  printBtn.addEventListener('click', () => {
    if(!customerInput.value){ alert('Nhập tên khách'); return; }
    if(cart.length===0){ alert('Chưa có hàng'); return; }

    const today = new Date();
    const ngay  = saleDateInput.value || today.toISOString().slice(0,10);

    const popup = window.open('', '_blank');
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hóa đơn</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;font-size:14px;margin:20px;}
      .header{display:flex;gap:20px;margin-bottom:10px;}
      .header img{height:60px;}
      h2{color:#c00;text-align:center;margin:8px 0 2px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th,td{border:1px solid #000;padding:4px;text-align:center;}
      th{background:#f0f0f0;}
      .no-border td{border:none;text-align:left;padding:2px 0;}
    </style></head><body>`;

    // Header công ty (bạn thay logo + thông tin thật)
    html += `<div class="header">
      <img src="/logo.png" alt="logo" onerror="this.style.display='none'"/>
      <div>
        <strong>Điện Nước Minh Châu</strong><br/>
        Mã số thuế: 8056681027-001<br/>
        Địa chỉ: Chợ Xuân Thọ - Phường Xuân Trường - TP Đà Lạt<br/>
        Điện thoại: 0973778279 - Zalo: 0938039084<br/>
        Số tài khoản: 9973778279 – Ngân hàng Vietcombank - Dương Xuân Hiệp
      </div>
    </div>`;

    html += `<h2>HÓA ĐƠN BÁN HÀNG</h2><p style="text-align:center">Ngày ${ngay.split('-').reverse().join('-')}</p>`;

    html += `<table class="no-border"><tr><td><strong>Người mua hàng:</strong> ${customerInput.value}</td></tr>
              <tr><td><strong>Địa chỉ:</strong> .................................................................</td></tr></table><br/>`;

    html += `<table><tr><th>STT</th><th>Tên hàng hóa, dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>`;
    let tong=0;
    cart.forEach((it,i)=>{
      const sub=it.qty*it.price;
      tong+=sub;
      html+=`<tr><td>${i+1}</td><td style="text-align:left">${it.name}</td><td>${it.qty}</td><td>${currency(it.price)}</td><td>${currency(sub)}</td></tr>`;
    });
    html+=`<tr><td colspan="4" style="text-align:right"><strong>Tổng cộng</strong></td><td><strong>${currency(tong)}</strong></td></tr></table>`;

    html+=`<p style="margin-top:40px;text-align:center">Người mua hàng &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Người bán hàng</p>`;
    html+='</body></html>';

    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  });

  /* ====== XEM CHI TIẾT NGÀY / ĐĂNG XUẤT ====== */
  detailBtn.addEventListener('click', () => {
    if(!saleDateInput.value){ alert('Chọn ngày'); return; }
    window.open('/chi-tiet-ban-hang?ngay='+saleDateInput.value, '_blank');
  });

  logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method:'POST' }).finally(()=>window.location.href='/index.html');
  });
});