const pool = require('../config/database');
(async () => {
  try {
    const userId = 14;
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [userId]);
    console.log('seekers', seekers);
    if (seekers.length === 0) return;
    const jobSeekerId = seekers[0].id;
    const [cvs] = await pool.execute('SELECT id, file_name, file_path, created_at FROM cvs WHERE job_seeker_id = ?', [jobSeekerId]);
    console.log('cvs', cvs);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
