const express = require('express');
const { getProfileDetails, updateProfileDetails, uploadPhoto } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.get('/profile-details', authMiddleware, getProfileDetails);
router.put('/profile-details', authMiddleware, updateProfileDetails);
router.post('/profile-details/upload-photo', authMiddleware, upload.single('gambar_profil'), uploadPhoto); // Ensure 'gambar_profil' is the field name

module.exports = router;