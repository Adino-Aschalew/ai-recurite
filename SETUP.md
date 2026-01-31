# Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- OpenAI API key (optional, for enhanced AI features)

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Database Setup

1. Create MySQL database:
```bash
mysql -u root -p < database/schema.sql
```

Or manually:
```sql
CREATE DATABASE ai_recruitment_db;
USE ai_recruitment_db;
SOURCE database/schema.sql;
```

### 3. Environment Configuration

1. Copy environment file:
```bash
cp server/.env.example server/.env
```

2. Edit `server/.env` with your configuration:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_recruitment_db

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your_openai_api_key_here

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

3. Create uploads directory:
```bash
mkdir -p server/uploads
```

### 4. Run the Application

#### Development Mode

Run both server and client:
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

#### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start server
cd ../server
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Default Roles

The database is pre-populated with these roles:
- `job_seeker` - Job seeker role
- `recruiter` - Recruiter/HR role
- `admin` - System administrator

## Testing

### Create Test Users

1. Register as Job Seeker:
   - Email: seeker@test.com
   - Password: Test1234
   - Role: job_seeker

2. Register as Recruiter:
   - Email: recruiter@test.com
   - Password: Test1234
   - Role: recruiter

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists

### File Upload Issues
- Check `server/uploads` directory exists
- Verify file size limits in `.env`
- Check file permissions

### OpenAI API Issues
- Verify API key is set in `.env`
- Check API quota/limits
- Application will fall back to rule-based scoring if API fails

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up SSL/HTTPS
5. Use environment-specific database
6. Configure proper file storage (S3, etc.)
7. Set up monitoring and logging
8. Configure rate limiting appropriately

