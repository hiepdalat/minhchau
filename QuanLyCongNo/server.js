const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));  // Chứa file HTML, CSS, JS frontend
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect('mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority&appName=QuanLyCongNo')
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Schema + Model
const HangHoaSchema = new mongoose.Schema({
  noidung: String,
  soluong: Number,
  dongia: Number
}, { _id: false });

const CongNoSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  ngay: { type: String, required: true },
  hanghoa: { type: [HangHoaSchema], required: true }
});

const CongNo = mongoose.model('CongNo', CongNoSchema);

// Route API
app.post('/api/congno', async (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  try {
    const newRecord = new CongNo({ ten, ngay, hanghoa });
    await newRecord.save();
    res.json({ success: true, message: 'Đã lưu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi lưu dữ liệu' });
  }
});

app.get('/api/congno', async (req, res) => {
  const keyword = (req.query.ten || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  try {
    const data = await CongNo.find({
      ten: { $regex: keyword, $options: 'i' }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi tìm kiếm' });
  }
});

app.get('/api/congno/all', async (req, res) => {
  try {
    const data = await CongNo.find();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu' });
  }
});

// 404 handler cho API
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API không tồn tại' });
});

// Server chạy
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
