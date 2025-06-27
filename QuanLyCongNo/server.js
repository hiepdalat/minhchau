const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

mongoose.connect('mongodb+srv://xuanhiep1112:r7aVuSkE8DEXVEyU@quanlycongno.vvimbfe.mongodb.net/QuanLyCongNo?retryWrites=true&w=majority')
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

app.post('/them', async (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
    return res.status(400).json({ success: false });
  }
  try {
    await new CongNo({
      ten,
      ten_khongdau: removeDiacritics(ten),
      ngay,
      hanghoa
    }).save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.get('/timkiem', async (req, res) => {
  const kw = removeDiacritics(req.query.ten || '');
  try {
    const data = await CongNo.find({
      ten_khongdau: { $regex: kw, $options: 'i' }
    });
    res.json(data);
  } catch {
    res.status(500).json([]);
  }
});

app.post('/xoa', async (req, res) => {
  const { id, index } = req.body;
  if (!id || index === undefined) {
    return res.status(400).json({ success: false });
  }
  try {
    const congno = await CongNo.findById(id);
    if (!congno) return res.status(404).json({ success: false });
    congno.hanghoa.splice(index, 1);
    if (congno.hanghoa.length === 0) {
      await CongNo.findByIdAndDelete(id);
    } else {
      await congno.save();
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});
app.post('/thanhtoan', async (req, res) => {
  const { id, index } = req.body;
  try {
    const doc = await CongNo.findById(id);              // Tìm tài liệu theo _id
    if (!doc || !doc.hanghoa[index]) 
      return res.status(404).send('Không tìm thấy');     // Không thấy thì báo lỗi

    doc.hanghoa[index].thanhtoan = true;                 // Gán trường "thanhtoan" = true
    await doc.save();                                    // Lưu lại MongoDB

    res.send({ ok: true });                              // Phản hồi thành công
  } catch (e) {
    console.error(e);                                    // Nếu có lỗi thì log ra
    res.status(500).send('Lỗi server');
  }
});
app.listen(PORT, () => console.log(`🚀 Server chạy trên port ${PORT}`));
