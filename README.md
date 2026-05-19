# 🎓 AI-Powered Digital Examination Platform

**Brainware University — School of Engineering, CSE-DS**
**Project-I, PROJ-CSD783 | Batch: 2022-26**

Team: Shibam Hazra · Santanu Mondal · Palash Sarkar · Sk Toufik Islam · Surajit Manna

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, React Router 6, Recharts, Socket.io-client |
| Backend  | Node.js, Express.js, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth     | JWT (jsonwebtoken) + bcryptjs |
| AI       | Anthropic Claude API (`claude-sonnet-4-20250514`) |

---

## Project Structure

```
exam-platform/
├── server/                  ← Express backend
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── examController.js
│   │   ├── questionController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── adminController.js
│   │   └── aiController.js       ← Anthropic AI feedback
│   ├── middleware/
│   │   ├── auth.js               ← JWT verification
│   │   └── roles.js              ← Role-based access control
│   ├── models/
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── Question.js
│   │   └── Submission.js
│   ├── routes/
│   │   ├── auth.js, questions.js, exams.js
│   │   ├── teacher.js, student.js, admin.js, ai.js
│   ├── index.js
│   └── .env.example
│
├── client/                  ← React frontend
│   ├── src/
│   │   ├── context/AuthContext.js
│   │   ├── utils/api.js
│   │   ├── components/Sidebar.js
│   │   ├── pages/
│   │   │   ├── Login.js, Register.js
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.js
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminUsers.js       ← Full CRUD + toggle active
│   │   │   │   ├── AdminExams.js       ← View/publish/delete all exams
│   │   │   │   ├── AdminSubmissions.js ← All submissions table
│   │   │   │   ├── AdminAiFeedbacks.js ← View all AI feedbacks
│   │   │   │   └── AdminAnalytics.js   ← Charts: bar, pie, line
│   │   │   ├── teacher/
│   │   │   │   ├── TeacherDashboard.js
│   │   │   │   ├── TeacherQuestions.js ← Question bank CRUD
│   │   │   │   ├── TeacherExams.js     ← Create (manual/auto), publish
│   │   │   │   ├── TeacherSubmissions.js ← View + bulk AI feedback
│   │   │   │   └── TeacherGrade.js    ← Grade SAQ + generate AI feedback
│   │   │   └── student/
│   │   │       ├── StudentDashboard.js ← Available exams
│   │   │       ├── TakeExam.js         ← Full exam with timer
│   │   │       ├── StudentResults.js
│   │   │       └── StudentResultDetail.js ← AI feedback view
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── package.json             ← Root (concurrent dev)
└── README.md
```

---

## Setup Instructions

### 1. Clone / Download and install

```bash
# From the project root:
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/exam_platform
JWT_SECRET=any_long_random_string
PORT=5000
ANTHROPIC_API_KEY=sk-ant-...   # Get from https://console.anthropic.com
```

### 3. Run development servers

```bash
npm run dev
```
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### 4. Create your first admin user

Call the register endpoint with role "admin":

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"admin123","role":"admin"}'
```

Or register via the UI and then update the role in MongoDB:
```
db.users.updateOne({email:"admin@example.com"}, {$set:{role:"admin"}})
```

---

## Features

### 👤 Authentication & Roles
- JWT-based login/register with 7-day token expiry
- Three roles: **Student**, **Teacher**, **Admin**
- Role-based route protection (frontend & backend)
- Account activate/deactivate by admin

### 🎓 Student Portal
- View available live/upcoming exams
- Take exams with countdown timer (auto-submit on expiry)
- Question navigator with answered/unanswered indicators
- MCQ (with randomized options) and Short Answer Questions
- View published results with percentage and grade
- View AI-generated personal feedback per exam

### 👨‍🏫 Teacher Portal
- Full question bank (create MCQ/SAQ, filter by subject/type/difficulty)
- Create exams: manual question selection or auto-pick by difficulty
- Set exam schedule (start/end datetime), publish/unpublish
- View all student submissions per exam
- Grade short-answer questions with manual marks
- One-click AI feedback generation per submission
- Bulk AI feedback for all submissions of an exam

### 🛡️ Admin Portal
- **Dashboard**: platform summary stats + recent submissions
- **User Management**: full CRUD, search/filter, activate/deactivate, role assignment
- **Exam Management**: view all exams, publish/unpublish, delete
- **Submissions**: paginated view with filters (published/pending)
- **AI Feedbacks**: browse all stored AI feedback records with full detail modal
- **Analytics**: interactive charts — avg scores per exam, user distribution pie, score distribution histogram, registration trend line, top students leaderboard

### 🤖 AI Feedback (Anthropic Claude)
- Triggered by teacher after publishing marks
- Calls `claude-sonnet-4-20250514` with student performance data
- Returns: overall feedback, strengths, weaknesses, study suggestions
- Stored in Submission document, visible to student and admin
- Bulk generation available per exam

### 🔌 Real-time (Socket.io)
- Teacher gets notified when a student submits
- Student gets notified when marks are published

---

## API Endpoints (summary)

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Register |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Current user |
| GET | /api/questions | Teacher | List own questions |
| POST | /api/questions | Teacher | Create question |
| GET | /api/exams/my | Teacher | List own exams |
| POST | /api/exams | Teacher | Create exam |
| GET | /api/exams/available | Student | Available exams |
| GET | /api/exams/:id/start | Student | Start exam |
| POST | /api/student/submit | Student | Submit exam |
| GET | /api/student/results | Student | Own results |
| GET | /api/teacher/submissions | Teacher | All submissions |
| POST | /api/teacher/submissions/:id/publish | Teacher | Publish marks |
| POST | /api/ai/feedback/:submissionId | Teacher/Admin | Generate AI feedback |
| POST | /api/ai/feedback/bulk/:examId | Teacher/Admin | Bulk AI feedback |
| GET | /api/admin/users | Admin | List users |
| GET | /api/admin/analytics | Admin | Full analytics |
| GET | /api/admin/ai-feedbacks | Admin | All AI feedbacks |
