const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const fs = require('fs');

const app = express();

// ----- PORT (local + Elastic Beanstalk) -----
const PORT = process.env.PORT || 3001;

// ----- CORS -----
const allowedOrigins = [
  'http://localhost:5173',
  'https://main.d30jlxmuqyna0j.amplifyapp.com', // dev frontend
];

if (process.env.FRONTEND_URL) {
  // e.g. https://main.d30jlxmuqyna0j.amplifyapp.com
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // อนุญาต:
      // - ไม่มี origin (เช่น Postman / server-side)
      // - origin อยู่ใน allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

// ----- Health check (เช็คง่าย ๆ) -----
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// ----- Upload folder -----
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// ----- /api/upload -----
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // ลบไฟล์หลังประมวลผล
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

// ----- Start server (0.0.0.0 for EB) -----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Backend server is running on port ${PORT}`);
});
