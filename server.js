// server.js – phiên bản hoàn chỉnh (giữ index.html làm trang đăng nhập)
// -----------------------------------------------------------------------------
// CÀI ĐẶT CẦN THIẾT:
//   npm i express mongoose express-session connect-mongo dotenv path
// -----------------------------------------------------------------------------
require('dotenv').config();
const express       = require('express');
const mongoose      = require('mongoose');
const path          = require('path');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');

// -----------------------------------------------------------------------------
// 1. KẾT NỐI MONGODB
// -----------------------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    process.exit(1);
  });

// -----------------------------------------------------------------------------
// 2. KHỞI TẠO EXPRESS APP
// -----------------------------------------------------------------------------
const app  = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));   // public chứa html/css/js

// -----------------------------------------------------------------------------
// 3. CẤU HÌNH SESSION (5 phút hết hạn) – LƯU VÀO MONGODB
// -----------------------------------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'mat_khau_bi_mat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 5 * 60 * 1000 }   // 5 phút (đổi tại đây nếu muốn)
}));
app.get('/session-check', (req, res) => {
  if (req.session.user) res.sendStatus(200);
  else res.sendStatus(401);
});
// -----------------------------------------------------------------------------
// 4. DEFINITIONS MONGOOSE
// -----------------------------------------------------------------------------
const HangHoaSchema = new mongoose.Schema({
  noidung:    String,
  soluong:    Number,
  dongia:     Number,
  thanhtoan: { type: Boolean, default: false }
}, { _id: false });

const CongNoSchema = new mongoose.Schema({
  ten:          String,
  ten_khongdau: String,
  ngay:         String,
  hanghoa:      [HangHoaSchema]
});
const CongNo = mongoose.model('CongNo', CongNoSchema);

// -----------------------------------------------------------------------------
// 5. TIỆN ÍCH CHỮ KHÔNG DẤU
// -----------------------------------------------------------------------------
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// -----------------------------------------------------------------------------
// 6. MIDDLEWARE BẢO VỆ TRANG NỘI BỘ
// -----------------------------------------------------------------------------
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/index.html');  // chưa login → về trang đăng nhập
  res.set('Cache-Control', 'no-store');                       // chống cache nút Back
  next();
}

// -----------------------------------------------------------------------------
// 7. ĐĂNG NHẬP / ĐĂNG XUẤT
// -----------------------------------------------------------------------------
// Giữ index.html là trang đăng nhập chính
app.get(['/', '/index.html', '/login'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// *** THÔNG TIN TÀI KHOẢN ***
// Bạn có thể thêm nhiều user khác nếu muốn
const USERS = {
  minhchau: '0938039084'            // tài khoản thật do bạn cung cấp
  // admin: '123456'                // (tùy chọn) tài khoản phụ để test
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

// -----------------------------------------------------------------------------
// 8. ROUTE TRANG CHÍNH
// -----------------------------------------------------------------------------
app.get('/congno', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'congno.html'));
});

// -----------------------------------------------------------------------------
// 9. API DỮ LIỆU – TẤT CẢ CẦN ĐĂNG NHẬP
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 10. KHỞI CHẠY SERVER
// -----------------------------------------------------------------------------
console.log('✅ Các route đã đăng ký:');
app._router.stack
  .filter(r => r.route && r.route.path)
  .forEach(r => console.log(' ▶', r.route.path));
app.listen(PORT, () => console.log(`🚀 Server chạy trên port ${PORT}`));
