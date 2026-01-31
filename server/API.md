# API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### POST /auth/register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "role": "job_seeker",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York",
  "companyName": "Company Name" // Required for recruiter role
}
```

#### POST /auth/login
Login user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### GET /auth/profile
Get current user profile.

---

### CVs

#### POST /cvs/upload
Upload a CV file (PDF/DOCX).

**Headers:** `Content-Type: multipart/form-data`

**Body:** Form data with `cv` field containing the file.

#### GET /cvs/:id
Get CV details with scores.

#### GET /cvs/job-seeker/:jobSeekerId?
Get all CVs for a job seeker.

#### POST /cvs/:cvId/score/:jobId
Score a CV against a job.

#### DELETE /cvs/:id
Delete a CV.

---

### Jobs

#### POST /jobs
Create a new job posting (Recruiter only).

**Body:**
```json
{
  "title": "Software Engineer",
  "description": "Job description...",
  "companyName": "Tech Corp",
  "location": "San Francisco",
  "employmentType": "full-time",
  "requirements": {
    "requiredSkills": ["JavaScript", "React"],
    "preferredSkills": ["Node.js"],
    "minExperienceYears": 3,
    "educationLevel": "bachelor"
  }
}
```

#### GET /jobs
Get all jobs (with optional filters: status, search, limit, offset).

#### GET /jobs/:id
Get job details.

#### GET /jobs/:id/candidates
Get ranked candidates for a job (Recruiter only).

#### GET /jobs/:jobId/interview-questions/:cvId
Generate interview questions for a candidate (Recruiter only).

#### PATCH /jobs/:id/status
Update job status (Recruiter only).

**Body:**
```json
{
  "status": "active"
}
```

#### DELETE /jobs/:id
Delete a job (Recruiter only).

---

### Applications

#### POST /applications/job/:jobId
Apply to a job (Job Seeker only).

**Body:**
```json
{
  "cvId": 1
}
```

#### GET /applications/my-applications
Get all applications for current job seeker.

#### GET /applications/job/:jobId
Get all applications for a job (Recruiter only).

#### GET /applications/:id
Get application details.

#### PATCH /applications/:id/status
Update application status (Recruiter only).

**Body:**
```json
{
  "status": "shortlisted",
  "notes": "Strong candidate"
}
```

---

### Analytics

#### GET /analytics/recruiter
Get recruiter analytics dashboard.

**Query params:** `startDate`, `endDate`

#### GET /analytics/job/:jobId
Get job-specific analytics.

#### GET /analytics/job/:jobId/export
Export applications report as CSV.

**Query params:** `format=csv`

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

