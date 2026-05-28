const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for generic documents
const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hrms/documents',
    resource_type: 'auto', // Allows non-image files like PDFs
    allowed_formats: ['pdf', 'jpg', 'png', 'jpeg', 'docx']
  }
});

// Storage for payslips
const payslipStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hrms/payslips',
    resource_type: 'auto',
    allowed_formats: ['pdf']
  }
});

// Storage for photos
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hrms/photos',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const uploadDoc = multer({ storage: docStorage });
const uploadPayslip = multer({ storage: payslipStorage });
const uploadPhoto = multer({ storage: photoStorage });

module.exports = {
  cloudinary,
  uploadDoc,
  uploadPayslip,
  uploadPhoto
};
