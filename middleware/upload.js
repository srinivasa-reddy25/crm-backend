const multer = require('multer');
const path = require('path');
const fs = require('fs');



const uploadDir = process.env.UPLOAD_DIR || 'uploads/temp';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    },
});


function csvFileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
        return cb(new Error('Only .csv files are allowed'));
    }
    cb(null, true);
}



const upload = multer({
    storage,
    fileFilter: csvFileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    },
});


module.exports = upload;
