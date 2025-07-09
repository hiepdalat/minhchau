// server.js – Gộp đầy đủ xử lý cho: công nợ, kho hàng (nhập), bán hàng
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// ======= KẾT NỐI MONGODB =======
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB lỗi:', err);
    process.exit(1);
  });

// ======= APP EXPRESS =======
const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mat_khau_bi_mat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 5 * 60 * 1000 }
}));

// ======= MIDDLEWARE =======
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/index.html');
  res.set('Cache-Control', 'no-store');
  next();
}

// ======= SCHEMA CÔNG NỢ =======
const HangHoaSchema = new mongoose.Schema({
  noidung: String,
  soluong: Number,
  dongia: Number,
  thanhtoan: { type: Boolean, default: false }
}, { _id: false });

const CongNoSchema = new mongoose.Schema({
  ten: String,
  ten_khongdau: String,
  ngay: String,
  hanghoa: [HangHoaSchema]
});
const CongNo = mongoose.model('CongNo', CongNoSchema);

// ======= SCHEMA NHẬP HÀNG =======
const itemSchema = new mongoose.Schema({
  tenhang:   String,
  dvt:       String,
  soluong:   Number,
  dongia:    Number,
  ck:        Number,
  gianhap:   Number,
  thanhtien: Number
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  ngay:     { type: Date, required: true },
  daily:    { type: String, required: true },
  items:    [itemSchema],
  tongtien: Number
});
const StockReceipt = mongoose.model('StockReceipt', receiptSchema);

// ======= ĐĂNG NHẬP =======
const USERS = { minhchau: '0938039084' };
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (USERS[username] && USERS[username] === password) {
    req.session.user = { username };
    return res.redirect('/congno');
  }
  res.status(401).send('Sai tài khoản hoặc mật khẩu');
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/index.html')));
app.get('/congno', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'congno.html')));
app.get('/khohang', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'khohang.html')));
app.get('/banhang', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'banhang.html')));

// ======= CÔNG NỢ =======
app.post('/them', requireLogin, async (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0)
    return res.status(400).json({ success: false });
  try {
    await new CongNo({ ten, ten_khongdau: removeDiacritics(ten), ngay, hanghoa }).save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.get('/timkiem', requireLogin, async (req, res) => {
  const kw = removeDiacritics(req.query.ten || '');
  try {
    const data = await CongNo.find({ ten_khongdau: { $regex: kw, $options: 'i' } });
    res.json(data);
  } catch {
    res.status(500).json([]);
  }
});

app.post('/xoa', requireLogin, async (req, res) => {
  const { id, index } = req.body;
  try {
    const congno = await CongNo.findById(id);
    if (!congno) return res.status(404).json({ success: false });
    congno.hanghoa.splice(index, 1);
    if (congno.hanghoa.length === 0) await CongNo.findByIdAndDelete(id);
    else await congno.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post('/thanhtoan', requireLogin, async (req, res) => {
  const { id, index } = req.body;
  try {
    const doc = await CongNo.findById(id);
    if (!doc || !doc.hanghoa[index]) return res.status(404).send('Không tìm thấy');
    doc.hanghoa[index].thanhtoan = true;
    await doc.save();
    res.send({ ok: true });
  } catch {
    res.status(500).send('Lỗi server');
  }
});

// ======= NHẬP HÀNG =======
app.post('/api/stock/receive', requireLogin, async (req, res) => {
  const { supplier, date, items } = req.body;
  if (!supplier || !date || !items?.length)
    return res.status(400).json({ error: 'Thiếu dữ liệu' });
  try {
    const mapped = items.map(it => {
      const gianhap = it.price * (1 - it.discount / 100);
      const thanhtien = gianhap * it.qty;
      return {
        tenhang: it.name,
        dvt: it.unit,
        soluong: it.qty,
        dongia: it.price,
        ck: it.discount,
        gianhap,
        thanhtien
      };
    });
    const tongtien = mapped.reduce((s, x) => s + x.thanhtien, 0);
    const receipt = await StockReceipt.create({
      ngay: new Date(date),
      daily: supplier,
      items: mapped,
      tongtien
    });
    res.json({ id: receipt._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stock/search', requireLogin, async (req, res) => {
  const keyword = removeDiacritics(req.query.daily || '');
  try {
    const data = await StockReceipt.find({ daily: { $regex: keyword, $options: 'i' } });
    res.json(data);
  } catch {
    res.status(500).json([]);
  }
});

app.get('/chi-tiet-phieu-nhap', requireLogin, async (req, res) => {
  try {
    const { ngay } = req.query;
    if (!ngay) return res.status(400).send('Thiếu tham số ngày');
    const start = new Date(ngay); start.setHours(0, 0, 0, 0);
    const end   = new Date(ngay); end.setHours(23, 59, 59, 999);
    const receipts = await StockReceipt.find({ ngay: { $gte: start, $lte: end } });
    if (!receipts.length) return res.send(`<h3>Không có phiếu nhập ngày ${ngay}</h3>`);
    let html = `<h2>Chi tiết phiếu nhập ngày ${ngay}</h2>`;
    receipts.forEach(r => {
      html += `<h3>Đại lý: ${r.daily}</h3><table border="1" cellspacing="0" cellpadding="4">
      <tr><th>Tên hàng</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>CK</th><th>Giá nhập</th><th>Thành tiền</th></tr>`;
      r.items.forEach(i => {
        html += `<tr><td>${i.tenhang}</td><td>${i.dvt}</td><td>${i.soluong}</td><td>${i.dongia.toLocaleString()}</td><td>${i.ck}%</td><td>${i.gianhap.toLocaleString()}</td><td>${i.thanhtien.toLocaleString()}</td></tr>`;
      });
      html += `<tr><td colspan="6" align="right"><b>Tổng:</b></td><td><b>${r.tongtien.toLocaleString()}</b></td></tr></table><br/>`;
    });
    res.send(html);
  } catch {
    res.status(500).send('Lỗi server');
  }
});

// ======= API TỒN KHO (cho bán hàng) =======
app.get('/api/products/stock', requireLogin, async (req, res) => {
  try {
    const all = await StockReceipt.find({});
    const stockMap = {};
    all.forEach(doc => {
      doc.items.forEach(item => {
        const name = item.tenhang;
        if (!stockMap[name]) {
          stockMap[name] = {
            name,
            unit: item.dvt,
            qty_on_hand: 0,
            price: item.dongia,
            code: name.toLowerCase().replace(/\s+/g, '_')
          };
        }
        stockMap[name].qty_on_hand += item.soluong;
      });
    });
    res.json(Object.values(stockMap));
  } catch {
    res.status(500).json([]);
  }
});

app.post('/api/products/update-stock', requireLogin, async (req, res) => {
  try {
    const { soldItems } = req.body;
    if (!Array.isArray(soldItems)) return res.status(400).send('Thiếu dữ liệu');
    for (const sold of soldItems) {
      const doc = await StockReceipt.findOne({ 'items.tenhang': sold.name });
      if (!doc) continue;
      const item = doc.items.find(i => i.tenhang === sold.name);
      if (item && item.soluong >= sold.qty) item.soluong -= sold.qty;
      await doc.save();
    }
    res.json({ ok: true });
  } catch {
    res.status(500).send('Lỗi khi cập nhật tồn kho');
  }
});

// ======= KHỞI ĐỘNG =======
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
