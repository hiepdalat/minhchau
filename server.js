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
// Đã xóa '_id: false' để Mongoose tự động tạo _id cho từng subdocument (món hàng)
const itemSchema = new mongoose.Schema({
    tenhang: { type: String, required: true },
    dvt: { type: String, required: true },
    soluong: { type: Number, required: true },
    dongia: { type: Number, required: true },
    ck: { type: Number, default: 0 },
    gianhap: { type: Number, required: true },
    thanhtien: { type: Number, required: true }
}); // Không có { _id: false } nữa

const receiptSchema = new mongoose.Schema({
    ngay: { type: Date, required: true },
    daily: { type: String, required: true },
    items: [itemSchema],
    tongtien: { type: Number, required: true }
}, { timestamps: true });

// === MODEL GỐC CHO COLLECTION 'stockreceipts' (GIỮ NGUYÊN) ===
const StockReceipt = mongoose.model('StockReceipt', receiptSchema);

// === MODEL MỚI CHO COLLECTION 'PhieuNhapKho' ===
const PhieuNhapKhoEntry = mongoose.model('PhieuNhapKhoEntry', receiptSchema, 'PhieuNhapKho');



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

app.get('/nhaphang', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nhaphang.html'));
});

app.get('/banhang', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'banhang.html'));
});

// Đảm bảo route này tồn tại và chính xác
app.get('/print-receipt', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'print-receipt.html'));
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
app.post('/api/nhaphang', requireLogin, async (req, res) => {
    try {
        const { ngay, daily, items, tongtien } = req.body;
        const newReceipt = new PhieuNhapKhoEntry({
            ngay: new Date(ngay),
            daily,
            items,
            tongtien
        });
        await newReceipt.save();
        res.status(201).json({ message: 'Phiếu nhập hàng đã được lưu thành công vào PhieuNhapKho!', receipt: newReceipt });
    } catch (err) {
        console.error('Lỗi khi lưu phiếu nhập hàng vào PhieuNhapKho:', err);
        res.status(500).json({ error: 'Không thể lưu phiếu nhập hàng vào PhieuNhapKho.' });
    }
});

app.get('/api/nhaphang', requireLogin, async (req, res) => {
    try {
        const { daily, month } = req.query;
        let query = {};

        if (daily) {
            query.daily = new RegExp(daily, 'i');
        }

        if (month) {
            const [year, monthNum] = month.split('-');
            const startDate = new Date(year, parseInt(monthNum) - 1, 1);
            const endDate = new Date(year, parseInt(monthNum), 0);

            query.ngay = {
                $gte: startDate,
                $lte: endDate
            };
        }
        const receipts = await PhieuNhapKhoEntry.find(query).sort({ ngay: -1 });
        res.json(receipts);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách nhập hàng từ PhieuNhapKho:', err);
        res.status(500).json({ error: 'Không thể lấy danh sách nhập hàng từ PhieuNhapKho.' });
    }
});

// API MỚI: Lấy một phiếu nhập cụ thể theo ID
app.get('/api/nhaphang/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await PhieuNhapKhoEntry.findById(id);
        if (!receipt) {
            return res.status(404).json({ error: 'Không tìm thấy phiếu nhập.' });
        }
        res.json(receipt);
    } catch (err) {
        console.error('Lỗi khi lấy chi tiết phiếu nhập:', err);
        res.status(500).json({ error: 'Không thể lấy chi tiết phiếu nhập.' });
    }
});


// API để xóa TOÀN BỘ phiếu nhập (dựa trên _id của phiếu)
app.delete('/api/nhaphang', requireLogin, async (req, res) => {
    try {
        const { ids } = req.body; // Expect an array of receipt IDs to delete
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một ID phiếu nhập để xóa.' });
        }
        const result = await PhieuNhapKhoEntry.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: `Đã xóa ${result.deletedCount} phiếu nhập hàng từ PhieuNhapKho.`, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Lỗi khi xóa phiếu nhập hàng:', err);
        res.status(500).json({ error: 'Không thể xóa phiếu nhập hàng.' });
    }
});

// API để xóa một món hàng cụ thể khỏi một phiếu nhập
app.delete('/api/nhaphang/item', requireLogin, async (req, res) => {
    try {
        const { receiptId, itemId } = req.body;

        if (!receiptId || !itemId) {
            return res.status(400).json({ error: 'Vui lòng cung cấp ID phiếu nhập và ID món hàng để xóa.' });
        }

        const receipt = await PhieuNhapKhoEntry.findById(receiptId);

        if (!receipt) {
            return res.status(404).json({ error: 'Không tìm thấy phiếu nhập.' });
        }

        const initialItemCount = receipt.items.length;

        // Sử dụng $pull để xóa subdocument theo _id của nó
        receipt.items.pull(itemId);

        if (receipt.items.length === initialItemCount) {
             // If item count didn't change, it means the item was not found.
             return res.status(404).json({ error: 'Không tìm thấy món hàng trong phiếu nhập này.' });
        }

        // Cập nhật lại tổng tiền của phiếu nhập
        receipt.tongtien = receipt.items.reduce((sum, item) => item.thanhtien + sum, 0); // Corrected sum calculation

        await receipt.save();

        res.status(200).json({ message: 'Đã xóa món hàng thành công và cập nhật phiếu nhập.', receipt });
    } catch (err) {
        console.error('Lỗi khi xóa món hàng khỏi phiếu nhập:', err);
        res.status(500).json({ error: 'Không thể xóa món hàng khỏi phiếu nhập.' });
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
