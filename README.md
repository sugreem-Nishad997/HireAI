# HireAI

HireAI is a full-stack recruitment platform that connects candidates and recruiters. It supports resume uploads and parsing, AI-assisted candidate-job matching, job applications, saved jobs, profile management, and recruiter workflows.

## Features

### Candidates
- Sign up and sign in with role-based access
- Upload resumes in PDF or DOC/DOCX format
- Parse resume data and preview uploaded files
- Maintain candidate profiles
- Browse, search, save, and apply for jobs
- View AI-based job recommendations, matched skills, and missing skills
- Track application status

### Recruiters
- Create and manage job postings
- View and update job applications
- Review candidate resumes and parsed information
- Schedule and track interviews
- Monitor recruiter dashboard metrics

### AI and integrations
- Groq/OpenAI-compatible models for resume parsing and job matching
- Cloudinary storage for uploaded resume files
- MongoDB for application data
- Redis and BullMQ for matching jobs
- Email delivery for authentication and notification workflows

## Tech stack

- **Frontend:** React 19, Vite 8, React Router, Material UI, Axios
- **Backend:** Node.js, Express 5
- **Database:** MongoDB with Mongoose
- **Queue/cache:** Redis with BullMQ and IORedis
- **AI:** Groq API
- **File storage:** Cloudinary
- **Resume parsing:** PDF parsing and Mammoth

## Project structure

```text
HireAI/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
└── backend/
    ├── src/
    │   ├── ai/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── queues/
    │   ├── routes/
    │   ├── services/
    │   ├── utils/
    │   └── workers/
    ├── scripts/
    └── package.json
```

## Prerequisites

- Node.js 20 or later
- npm
- MongoDB or a MongoDB Atlas connection
- Redis or an Upstash Redis connection
- Groq API key
- Cloudinary account
- Email account credentials for email features

## Environment setup

Create `backend/.env` using the variables below.

```dotenv
DB_URL=mongodb://localhost:27017/HireAI
JWT_SECRET=replace-with-a-long-random-secret

CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret

GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b

REDIS_URL=redis://localhost:6379

EMAIL_USER=your-email-address
EMAIL_PASS=your-email-app-password

CLIENT_URL=your-local-frontend-url

```

Optional frontend environment configuration:

```dotenv
# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

If `VITE_API_URL` is omitted, the frontend defaults to `http://localhost:3000/api`.

> Never commit real API keys or credentials. Replace the sample values and keep `backend/.env` outside version control. If credentials have already been exposed, revoke and rotate them.

## Installation

From the repository root:

```powershell
cd frontend
npm install

cd ..\backend
npm install
```

## Running locally

Start MongoDB and Redis locally or configure `DB_URL` and `REDIS_URL` for hosted services.

Start the backend in one terminal:

```powershell
cd backend
npm run dev
```

The API runs at `http://localhost:3000`.

Start the matching worker in a second terminal if queue-based matching is needed:

```powershell
cd backend
npm run worker
```

Start the frontend in a third terminal:

```powershell
cd frontend
npm run dev
```

Vite will print the local frontend URL, typically `http://localhost:5173`.

## Available scripts

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm run worker` | Start the BullMQ matching worker |
| `npm run seed:users` | Seed initial user accounts |
| `node src/server.js` | Start the API without Nodemon |

## API overview

The backend exposes routes under `http://localhost:3000/api`, including:

- `/api/auth/*` - authentication and OTP workflows
- `/api/profile/*` - candidate profiles
- `/api/resume/*` - resume upload, parsing, and retrieval
- `/api/jobs/*` - job listings
- `/api/applications/*` - candidate applications
- `/api/recruiter/*` - recruiter operations
- `/api/candidate-matching/*` - candidate matching workflows
- `/api/candidate/recommendations/*` - recommended jobs

## Building for production

Build the frontend:

```powershell
cd frontend
npm run build
```

The generated files are written to `frontend/dist`.

Start the backend API with:

```powershell
cd backend
node src/server.js
```
