const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

mongoose.connect('mongodb+srv://xuanhiep1112:<r7aVuSkE8DEXVEyU>@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority&appName=QuanLyCongNo')
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

const HangHoaSchema = new mongoose.Schema({
  nd: String,
  sl: Number,
  dg: Number
}, { _id: false });

const CongNoSchema = new mongoose.Schema({
  ten: String,
  ngay: String,
  hanghoa: [HangHoaSchema]
});

const CongNo = mongoose.model('CongNo', CongNoSchema);

app.post('/api/congno', async (req, res) => {
  try {
    const { ten, ngay, hanghoa } = req.body;
    if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    await new CongNo({ ten, ngay, hanghoa }).save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/congno', async (req, res) => {
  try {
    const keyword = (req.query.ten || '').toLowerCase();
    const data = await CongNo.find({ ten: { $regex: keyword, $options: 'i' } });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.post('/api/congno/saveall', async (req, res) => {
  try {
    await CongNo.deleteMany({});
    await CongNo.insertMany(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
