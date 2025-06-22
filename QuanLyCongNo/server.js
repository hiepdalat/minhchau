const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Kết nối MongoDB Atlas
mongoose.connect('mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority')
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Schema + Model
const HangHoaSchema = new mongoose.Schema({
  noidung: String,
  soluong: Number,
  dongia: Number
}, { _id: false });

const CongNoSchema = new mongoose.Schema({
  ten: String,
  ngay: String,
  hanghoa: [HangHoaSchema]
});

const CongNo = mongoose.model('CongNo', CongNoSchema);

// API
app.post('/them', async (req, res) => {
  try {
    const { ten, ngay, hanghoa } = req.body;
    if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    const record = new CongNo({ ten, ngay, hanghoa });
    await record.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

app.get('/timkiem', async (req, res) => {
  try {
    const keyword = (req.query.ten || '').toLowerCase();
    const data = await CongNo.find({ ten: { $regex: keyword, $options: 'i' } });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/luu', async (req, res) => {
  try {
    await CongNo.deleteMany({});
    await CongNo.insertMany(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Run
app.listen(PORT, () => console.log(`🚀 Server chạy trên port ${PORT}`));
