const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const fs = require('fs');
const ti = require('technicalindicators');

const app = express();

// --- PORT สำหรับทั้ง local และ AWS Elastic Beanstalk ---
const PORT = process.env.PORT || 3001;

// --- CORS: อนุญาต localhost และ FRONTEND_URL จาก env ---
const allowedOrigins = [
  'http://localhost:5173',          // ตอน develop
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL); // ตอนรันบน AWS
}

app.use(
  cors({
    origin: (origin, callback) => {
      // อนุญาต request ที่ไม่มี origin (เช่น Postman) หรืออยู่ใน allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// --- โฟลเดอร์เก็บไฟล์ชั่วคราว (EB ลบเมื่อ redeploy ก็ไม่เป็นไร) ---
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// --- Endpoint อัปโหลดไฟล์ + ประมวลผล ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // ลบไฟล์ออก เพราะเราไม่ต้องเก็บ
    fs.unlinkSync(req.file.path);

    const validData = data.filter(
      (row) => row && row.length >= 6 && row[0] && row[5]
    );

    if (validData.length === 0) {
      return res.status(400).json({ error: 'No valid data found in file.' });
    }

    const labels = validData.map((row) => `${row[0]} ${row[1]}`);
    const highPrices = validData.map((row) => parseFloat(row[3]));
    const lowPrices = validData.map((row) => parseFloat(row[4]));
    const closePrices = validData.map((row) => parseFloat(row[5]));

    // ส่งข้อมูลดิบกลับไปให้ frontend ใช้วาดกราฟ
    res.json({
      labels,
      prices: closePrices,
      highPrices,
      lowPrices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

// --- สำคัญ: ใช้ 0.0.0.0 เพื่อให้ EB เข้าได้ ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Backend server is running on port ${PORT}`);
});
