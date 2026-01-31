const cvService = require('../services/cvService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

class CVController {
  async uploadCV(req, res, next) {
    try {
      const jobSeekerId = req.user.role === 'job_seeker' 
        ? await this.getJobSeekerId(req.user.id)
        : req.body.jobSeekerId;

      if (!jobSeekerId) {
        return res.status(400).json({ error: 'Job seeker ID required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'CV file required' });
      }

      const result = await cvService.uploadCV(jobSeekerId, req.file);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Temporary test upload route for local testing (no auth). Expects form field `jobSeekerId` and file `cv`.
  async uploadCVTest(req, res, next) {
    try {
      const jobSeekerId = req.body.jobSeekerId ? parseInt(req.body.jobSeekerId, 10) : null;

      if (!jobSeekerId) {
        return res.status(400).json({ error: 'jobSeekerId required for test upload' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'CV file required' });
      }

      const result = await require('../services/cvService').uploadCV(jobSeekerId, req.file);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async scoreCV(req, res, next) {
    try {
      const { cvId, jobId } = req.params;
      const result = await cvService.scoreCV(parseInt(cvId), parseInt(jobId));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCV(req, res, next) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id, 10);
      if (Number.isNaN(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'Invalid CV id' });
      }

      const result = await cvService.getCV(idNum, req.user.id, req.user.role);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobSeekerCVs(req, res, next) {
    try {
      const jobSeekerId = req.user.role === 'job_seeker'
        ? await this.getJobSeekerId(req.user.id)
        : req.params.jobSeekerId;

      console.log('getJobSeekerCVs called for jobSeekerId=', jobSeekerId, 'user=', req.user && req.user.id);

      if (!jobSeekerId) {
        return res.status(400).json({ error: 'Job seeker ID required' });
      }

      const result = await cvService.getJobSeekerCVs(parseInt(jobSeekerId));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCV(req, res, next) {
    try {
      const { id } = req.params;
      const result = await cvService.deleteCV(parseInt(id), req.user.id, req.user.role);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobSeekerId(userId) {
    const pool = require('../config/database');
    const [seekers] = await pool.execute(
      'SELECT id FROM job_seekers WHERE user_id = ?',
      [userId]
    );
    return seekers.length > 0 ? seekers[0].id : null;
  }
}

const controller = new CVController();

module.exports = {
  controller,
  upload: upload.single('cv')
};

