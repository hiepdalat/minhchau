// 📦 GỘP CẢ 3 SERVER: đăng nhập + công nợ + nhập hàng + bán hàng
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// ======= MONGODB KẾT NỐI =======
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => {
    console.error('❌ Lỗi MongoDB:', err);
    process.exit(1);
  });

// ======= EXPRESS APP & CẤU HÌNH =======
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mat_khau_bi_mat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1 * 60 * 60 * 1000 } // 1 tiếng
}));

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

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/index.html');
  res.set('Cache-Control', 'no-store');
  next();
}
app.get('/api/congno', requireLogin, async (req, res) => {
  try {
    const data = await CongNo.find({});
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});
// ======= SCHEMA NHẬP HÀNG =======
const itemSchema = new mongoose.Schema({
  tenhang:   { type: String, required: true },
  dvt:       { type: String, required: true },
  soluong:   { type: Number, required: true },
  dongia:    { type: Number, required: true },
  ck:        { type: Number, default: 0 },
  gianhap:   { type: Number, required: true },
  thanhtien: { type: Number, required: true }
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  ngay:     { type: Date, required: true },
  daily:    { type: String, required: true },
  items:    [itemSchema],
  tongtien: { type: Number, required: true }
}, { timestamps: true });

const StockReceipt = mongoose.model('StockReceipt', receiptSchema);

// ======= SCHEMA KHO HÀNG =======
const productSchema = new mongoose.Schema({
  code: String,
  name: String,
  unit: String,
  qty_on_hand: Number,
  price: Number
});
const Product = mongoose.model('Product', productSchema);

// ======= ĐĂNG NHẬP / ĐĂNG XUẤT =======
const USERS = {
  minhchau: '0938039084'
};

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

app.get('/congno', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'congno.html'));
});

app.get('/khohang', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'khohang.html'));
});

app.get('/banhang', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'banhang.html'));
});

app.get('/session-check', (req, res) => {
  if (req.session.user) res.sendStatus(200);
  else res.sendStatus(401);
});

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
  if (!id || index === undefined) return res.status(400).json({ success: false });
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
  } catch (e) {
    console.error(e);
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
         _id: new mongoose.Types.ObjectId(),
        tenhang: it.product,
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/stock/search-daily', requireLogin, async (req, res) => {
  try {
    const kw = removeDiacritics(req.query.ten || '');
    const thang = req.query.thang; // "2025-07"

    if (!kw || !thang) {
      return res.status(400).json({ error: "Thiếu tên hoặc tháng" });
    }

    const startDate = new Date(thang + "-01");
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // ngày cuối tháng

    const all = await StockReceipt.find({
      ngay: { $gte: startDate, $lte: endDate }
    });

    const matched = all.filter(r => removeDiacritics(r.daily).includes(kw));

    let result = [];
    matched.forEach(r => {
      r.items.forEach(item => {
        result.push({
          _id: item._id,
          ngay: r.ngay.toISOString().split('T')[0],
          daily: r.daily,
          tenhang: item.tenhang,
          dvt: item.dvt,
          soluong: item.soluong,
          dongia: item.dongia,
          ck: item.ck,
          gianhap: item.gianhap,
          thanhtien: item.thanhtien
        });
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
app.get('/api/stock/search-supplier', requireLogin, async (req, res) => {
  try {
    const kw = removeDiacritics(req.query.ten || '');
    const receipts = await StockReceipt.find();
    const uniqueSuppliers = Array.from(new Set(
      receipts
        .map(r => ({ ten: r.daily, ten_khongdau: removeDiacritics(r.daily) }))
        .filter(s => s.ten_khongdau.includes(kw))
        .map(s => s.ten)
    ));
    res.json(uniqueSuppliers.map(ten => ({ ten })));
  } catch (err) {
    console.error("Lỗi tìm đại lý nhập hàng:", err);
    res.status(500).json([]);
  }
});
app.get('/api/stock/receipt-by-date', requireLogin, async (req, res) => {
  try {
    const { ngay } = req.query;
    if (!ngay) return res.status(400).json({ error: 'Thiếu tham số ngày' });

    const start = new Date(ngay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ngay);
    end.setHours(23, 59, 59, 999);

    const receipts = await StockReceipt.find({ ngay: { $gte: start, $lte: end } });
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
app.delete('/api/stock/delete-row', requireLogin, async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Thiếu ID" });

  try {
    const objectId = new mongoose.Types.ObjectId(id);
    const result = await StockReceipt.updateOne(
      { "items._id": objectId },
      { $pull: { items: { _id: objectId } } }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ error: "Không tìm thấy dòng để xóa" });

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi khi xóa dòng:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});
// ======= API SẢN PHẨM (cho bán hàng) =======
app.get('/api/products/stock', requireLogin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

// ======= KHỞI ĐỘNG SERVER =======
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
