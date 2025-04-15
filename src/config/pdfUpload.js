import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false); // Reject file
  }
};

export const upload = multer({ storage, fileFilter });



// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "files")
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() 
//     cb(null, uniqueSuffix + file.originalname)     
//   }
// })
