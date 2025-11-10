const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const fs = require('fs');
const ti = require('technicalindicators');

const app = express();
const PORT = 3001;
app.use(cors());

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir); }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- 💡 กลับไปใช้ upload.single('file') เหมือนเดิม ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    fs.unlinkSync(req.file.path);

    const validData = data.filter(row => row && row.length >= 6 && row[0] && row[5]);
    if (validData.length === 0) {
      return res.status(400).json({ error: 'No valid data found in file.' });
    }
    
    const labels = validData.map(row => `${row[0]} ${row[1]}`);
    const highPrices = validData.map(row => parseFloat(row[3]));
    const lowPrices = validData.map(row => parseFloat(row[4]));
    const closePrices = validData.map(row => parseFloat(row[5]));
    
    // --- 💡 ส่งข้อมูลดิบทั้งหมดที่จำเป็นกลับไปให้ Frontend ---
    res.json({
      labels,
      prices: closePrices,
      highPrices, // << ส่งเพิ่ม
      lowPrices,  // << ส่งเพิ่ม
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

app.listen(PORT, () => {
  console.log(`✨ Backend server is running on http://localhost:${PORT}`);
});