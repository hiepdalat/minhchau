require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// ===== MongoDB Connection =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority&appName=QuanLyCongNo';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(console.error);

// ===== Schema & Model =====
const { Schema } = mongoose;
const itemSchema = new Schema(
  {
    tenhang:   { type: String, required: true },
    dvt:       { type: String, required: true },
    soluong:   { type: Number, required: true },
    dongia:    { type: Number, required: true },
    ck:        { type: Number, default: 0 },
    gianhap:   { type: Number, required: true },
    thanhtien: { type: Number, required: true }
  },
  { _id: false }
);

const receiptSchema = new Schema(
  {
    ngay:     { type: Date, required: true },
    daily:    { type: String, required: true },
    items:    [itemSchema],
    tongtien: { type: Number, required: true }
  },
  { timestamps: true }
);

const StockReceipt = mongoose.model('StockReceipt', receiptSchema);

// ===== Express App =====
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // đặt nhaphang.html + assets trong ./public

// POST /api/stock/receive
app.post('/api/stock/receive', async (req, res) => {
  try {
    const { supplier, date, items } = req.body;
    if (!supplier || !date || !items?.length) return res.status(400).json({ error: 'Thiếu dữ liệu' });

    // Tính toán server‑side
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /chi-tiet-phieu-nhap?ngay=YYYY-MM-DD
app.get('/chi-tiet-phieu-nhap', async (req, res) => {
  try {
    const { ngay } = req.query;
    if (!ngay) return res.status(400).send('Thiếu tham số ngày');

    const start = new Date(ngay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ngay);
    end.setHours(23, 59, 59, 999);

    const receipts = await StockReceipt.find({ ngay: { $gte: start, $lte: end } });
    if (!receipts.length) return res.send(`<h3>Không có phiếu nhập ngày ${ngay}</h3>`);

    let html = `<h2>Chi tiết phiếu nhập ngày ${ngay}</h2>`;
    receipts.forEach((r) => {
      html += `<h3>Đại lý: ${r.daily}</h3><table border="1" cellspacing="0" cellpadding="4"><tr><th>Tên hàng</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>CK</th><th>Giá nhập</th><th>Thành tiền</th></tr>`;
      r.items.forEach((i) => {
        html += `<tr><td>${i.tenhang}</td><td>${i.dvt}</td><td>${i.soluong}</td><td>${i.dongia.toLocaleString()}</td><td>${i.ck}%</td><td>${i.gianhap.toLocaleString()}</td><td>${i.thanhtien.toLocaleString()}</td></tr>`;
      });
      html += `<tr><td colspan="6" align="right"><b>Tổng:</b></td><td><b>${r.tongtien.toLocaleString()}</b></td></tr></table><br/>`;
    });

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`ServerNhap chạy tại http://localhost:${PORT}`));
