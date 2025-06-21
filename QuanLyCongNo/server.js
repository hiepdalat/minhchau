const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

const dataFile = path.join(__dirname, 'data.json');

function readData() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.get('/timkiem', (req, res) => {
  const keyword = (req.query.ten || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const data = readData().filter(x => 
    x.ten && x.ten.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(keyword)
  );
  res.json(data);
});

app.post('/them', (req, res) => {
  const { ten, ngay, hanghoa } = req.body;
  if (!ten || !ngay || !Array.isArray(hanghoa) || hanghoa.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  const data = readData();
  data.push({ ten, ngay, hanghoa });
  writeData(data);
  res.json({ success: true });
});

app.post('/luu', (req, res) => {
  writeData(req.body);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));