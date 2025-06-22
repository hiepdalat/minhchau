const express = require('express');
const mongoose = require('mongoose');
const app = express();

// MIDDLEWARE
app.use(express.static('public'));
app.use(express.json());

// KẾT NỐI MONGODB ATLAS
const MONGO_URI = 'mongodb+srv://xuanhiep1112:<YOUR_PASSWORD>@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority&appName=QuanLyCongNo';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err.message));

// SCHEMA + MODEL
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
    const record = new CongNo({ ten, ngay, hanghoa });
    await record.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/timkiem', async (req, res) => {
  const keyword = req.query.ten || '';
  const regex = new RegExp(keyword, 'i');
  const data = await CongNo.find({ ten: regex });
  res.json(data);
});

app.get('/danhsach', async (req, res) => {
  const data = await CongNo.find();
  res.json(data);
});

// LẮNG NGHE PORT ĐÚNG CHUẨN RENDER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server chạy trên port ${PORT}`));
