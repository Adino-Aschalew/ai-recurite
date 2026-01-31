# AI Recruitment Platform

Production-ready AI-powered recruitment web application with real NLP-based CV scoring and candidate matching.

## Features

### Job Seekers
- Secure registration and authentication
- Profile management
- CV upload (PDF/DOCX)
- AI-powered CV parsing and scoring
- Detailed score breakdown with explanations
- CV improvement suggestions
- CV version history

### Recruiters/HR
- Create and manage job postings
- View AI-ranked candidates
- Candidate comparison tools
- Analytics dashboard
- Export reports (PDF/CSV)
- Interview question generation

### AI Features
- Real NLP-based CV scoring (OpenAI + spaCy)
- Skill gap analysis
- CV rewrite suggestions
- Bias reduction mode
- Job fit explanations
- Interview question generator
- Career path prediction
- Plagiarism detection

## Tech Stack

- **Frontend**: React 18 with modern hooks
- **Backend**: Node.js + Express.js
- **Database**: MySQL (normalized, transactional)
- **Authentication**: JWT + Role-Based Access Control
- **AI**: OpenAI GPT-4, spaCy, Natural NLP
- **File Processing**: pdf-parse, mammoth.js

## Installation

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

3. Set up MySQL database:
```bash
mysql -u root -p < database/schema.sql
```

4. Run the application:
```bash
npm run dev
```

## Environment Variables

See `server/.env.example` for required configuration.

## Project Structure

```
├── server/           # Backend Express application
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── services/     # Business logic & AI services
│   ├── models/       # Database models
│   ├── middleware/   # Auth, validation, etc.
│   ├── routes/       # API routes
│   ├── utils/        # Helper functions
│   └── uploads/      # File uploads directory
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
└── database/         # SQL schema files
```

## License

MIT

