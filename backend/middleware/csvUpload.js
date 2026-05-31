import multer from 'multer';

// Store uploads temporarily in memory
const storage = multer.memoryStorage();

// Validate file type (accept only CSV files)
const fileFilter = (req, file, cb) => {
  const isCsv = 
    file.mimetype === 'text/csv' || 
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv');
  
  if (isCsv) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV files (.csv) are allowed.'), false);
  }
};

const csvUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export default csvUpload;
