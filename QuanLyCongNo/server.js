// 📦 GỘP SERVER: Đăng nhập + Công nợ + Nhập hàng + Bán hàng
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// ======= KẾT NỐI MONGODB =======
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => {
    console.error('❌ Lỗi MongoDB:', err);
    process.exit(1);
  });

// ======= APP CƠ BẢN =======
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

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/index.html');
  next();
}

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
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
  tenhang: String,
  dvt: String,
  soluong: Number,
  dongia: Number,
  ck: Number,
  gianhap: Number,
  thanhtien: Number
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  ngay: Date,
  daily: String,
  items: [itemSchema],
  tongtien: Number
}, { timestamps: true });

const StockReceipt = mongoose.model('StockReceipt', receiptSchema);

// ======= SCHEMA TỒN KHO =======
const ProductSchema = new mongoose.Schema({
  name: String,
  unit: String,
  qty_on_hand: Number,
  price: Number
});
const Product = mongoose.model('Product', ProductSchema);

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

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/index.html'));
});

// ======= TRANG =======
app.get('/congno', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public/congno.html')));
app.get('/khohang', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public/khohang.html')));
app.get('/banhang', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public/banhang.html')));

// ======= API CÔNG NỢ =======
app.post('/them', requireLogin, async (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
    return res.status(400).json({ success: false });
  }
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
    doc.hanghoa[index].thanhtoan = true;
    await doc.save();
    res.send({ ok: true });
  } catch {
    res.status(500).send('Lỗi server');
  }
});

// ======= API NHẬP HÀNG =======
app.post('/api/stock/receive', requireLogin, async (req, res) => {
  try {
    const { supplier, date, items } = req.body;
    if (!supplier || !date || !items?.length) return res.status(400).json({ error: 'Thiếu dữ liệu' });
    const mapped = items.map((it) => {
      const giaNhap = it.price * (1 - it.discount / 100);
      const thanhTien = giaNhap * it.qty;
      return {
        tenhang: it.name,
        dvt: it.unit,
        soluong: it.qty,
        dongia: it.price,
        ck: it.discount,
        gianhap: giaNhap,
        thanhtien: thanhTien
      };
    });
    const tongtien = mapped.reduce((s, x) => s + x.thanhtien, 0);
    const receipt = await StockReceipt.create({ ngay: new Date(date), daily: supplier, items: mapped, tongtien });
    res.json({ id: receipt._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stock/search', requireLogin, async (req, res) => {
  const kw = req.query.daily || '';
  const regex = new RegExp(kw, 'i');
  const docs = await StockReceipt.find({ daily: { $regex: regex } });
  res.json(docs);
});

app.get('/chi-tiet-phieu-nhap', requireLogin, async (req, res) => {
  const { ngay } = req.query;
  const start = new Date(ngay);
  start.setHours(0, 0, 0, 0);
  const end = new Date(ngay);
  end.setHours(23, 59, 59, 999);
  const receipts = await StockReceipt.find({ ngay: { $gte: start, $lte: end } });
  res.json(receipts);
});

// ======= API BÁN HÀNG =======
app.get('/api/products/stock', requireLogin, async (req, res) => {
  const list = await Product.find();
  res.json(list);
});

app.post('/api/products/update-stock', requireLogin, async (req, res) => {
  try {
    const { items } = req.body;
    for (let i of items) {
      await Product.updateOne({ name: i.name }, { $inc: { qty_on_hand: -i.qty } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ======= CHẠY SERVER =======
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
