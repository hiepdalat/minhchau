require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const ProductSchema = new mongoose.Schema({
  code: String,
  name: String,
  unit: String,
  price: Number,
  qty_on_hand: Number
});

const Product = mongoose.model('Product', ProductSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products/stock', async (req, res) => {
  const stock = await Product.find({}, '-_id code name unit price qty_on_hand');
  res.json(stock);
});

app.post('/logout', (req, res) => {
  // Thêm xử lý xóa session nếu có (hoặc đơn giản chỉ phản hồi OK)
  res.json({ message: 'Đã đăng xuất' });
});

app.get('/chi-tiet-ban-hang', (req, res) => {
  const ngay = req.query.ngay || '';
  res.send(`<h2>Chi tiết bán hàng ngày ${ngay}</h2><p>Hiển thị dữ liệu ở đây sau khi có cơ chế lưu hóa đơn.</p>`);
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => console.log('Bán hàng server chạy ở cổng', PORT));
