const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// KẾT NỐI MONGODB ATLAS
mongoose.connect('mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority&appName=QuanLyCongNo')
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

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

// API TÌM KIẾM
app.get('/timkiem', async (req, res) => {
  const keyword = (req.query.ten || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  try {
    const data = await CongNo.find({
      ten: { $regex: keyword, $options: 'i' }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// API THÊM MỚI
app.post('/them', async (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  try {
    const newRecord = new CongNo({ ten, ngay, hanghoa });
    await newRecord.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lưu dữ liệu' });
  }
});

// API GHI ĐÈ TOÀN BỘ (nếu cần)
app.post('/luu', async (req, res) => {
  try {
    await CongNo.deleteMany({});
    await CongNo.insertMany(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lưu toàn bộ' });
  }
});

// CHẠY SERVER
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
