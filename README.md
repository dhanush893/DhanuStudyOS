# DHANU STUDY OS

> **Think. Learn. Evolve.**
>
> A student-first AI study command center designed to turn a syllabus, limited study time, and uncertain confidence into a realistic next step.

[![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI_API-412991?logo=openai&logoColor=white)](https://platform.openai.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 What is DHANU STUDY OS?

DHANU STUDY OS is a lightweight AI-powered study workspace built around a simple idea:

**Students do not need another place to collect information. They need help deciding what to do next.**

The application combines planning, time management, confidence checks, active recall, practice, and progress tracking into one student-focused experience.

Instead of creating an unrealistic timetable, DHANU STUDY OS asks about the learner's actual situation and generates a practical study plan around it.

### Core workflow

**Syllabus → Plan → Focus → Practice → Recall → Review → Improve**

---

## ✨ Current Experience

### 🎯 Student Command Center

A dashboard built around the student's immediate priority rather than an overwhelming list of tasks.

- Today's study focus
- Next-best-move guidance
- Focus-time tracking
- Completed-task tracking
- Study streak
- Confidence indicator
- Subject overview
- AI coach guidance

### 🧠 AI Study Planner

Give DHANU STUDY OS your syllabus, chapters, homework, or exam topics and provide your real constraints.

The planner considers:

- Exam / target date
- Minutes available per day
- Confidence level
- Plan length
- The student's actual study mission

With an OpenAI API key configured, the app generates a structured plan designed around realistic study sessions, active recall, practice, mistakes, and revision.

### 📚 Subjects & Learning Map

Organise learning by subject and confidence instead of simply following textbook order.

### 🔄 Remember / Revision Mode

The experience is designed around active recall rather than passive rereading, with short revision sessions focused on what the student is most likely to forget.

### 🎯 Practice Lab

A dedicated space for targeted practice. The product direction is to use practice to expose weak areas rather than simply increase question volume.

### 📈 Progress

Track meaningful learning signals such as:

- Focus time
- Completed tasks
- Study streak
- Confidence checks

The goal is to measure **learning progress, not busyness**.

---

## 🤖 AI + Demo Mode

DHANU STUDY OS supports two operating modes:

**AI Mode** — uses the configured OpenAI API to generate personalised study plans.

**Demo Mode** — works without an API key by generating a built-in seven-day study structure, making the project easy to test and demonstrate locally.

If an AI request fails, the application falls back to the demo planning flow instead of leaving the user without a result.

> **Important:** Never commit a real API key to GitHub. Use environment variables for secrets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python + Flask |
| AI | OpenAI API |
| Frontend | HTML, CSS, JavaScript |
| Production server | Gunicorn |
| Configuration | Environment variables |
| Source control | Git + GitHub |

The project is intentionally lightweight so it can be deployed and iterated quickly.

---

## 📁 Project Structure

```text
DhanuStudyOS/
├── app.py                 # Flask application + study-plan API
├── requirements.txt       # Python dependencies
├── .env.example           # Environment-variable template
├── templates/
│   └── index.html         # Main student experience
├── static/
│   ├── style.css          # UI styling
│   └── app.js             # Frontend interactions
├── LICENSE
└── README.md
```

---

## ⚡ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/dhanush893/DhanuStudyOS.git
cd DhanuStudyOS
```

### 2. Create a virtual environment

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure AI (optional)

Copy `.env.example` to `.env` and configure your API key.

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

You can run the application without an API key; it will use Demo Mode.

### 5. Start the app

```bash
python app.py
```

Open:

```text
http://localhost:8000
```

For production-style serving:

```bash
gunicorn app:app
```

---

## 🔐 Security & Privacy

- API keys should be stored only in environment variables.
- `.env` files should never be committed to the repository.
- Do not paste passwords, private credentials, or other sensitive information into study prompts.
- Student content should be treated as private application data when deploying or extending the project.

---

## 🗺️ Roadmap

DHANU STUDY OS is being developed as a broader study operating system. Planned improvements include:

- [ ] Syllabus upload and structured extraction
- [ ] Persistent student profiles and study history
- [ ] More adaptive weak-topic detection
- [ ] AI-generated quizzes and mock exams
- [ ] Smarter spaced-revision scheduling
- [ ] Detailed learning analytics
- [ ] Flashcards and active-recall decks
- [ ] Exam-readiness scoring
- [ ] More subjects and curriculum support
- [ ] Improved accessibility and offline-friendly experiences

The roadmap is intentionally focused on features that improve learning outcomes rather than adding complexity for its own sake.

---

## 💡 Design Philosophy

DHANU STUDY OS follows five principles:

1. **Student-first** — design around real student constraints.
2. **Less guilt, more clarity** — always give the learner a practical next step.
3. **Active learning** — prioritise recall, practice, mistakes, and revision.
4. **Realistic planning** — work with the time a student actually has.
5. **Learning over busyness** — progress should reflect understanding, not hours spent staring at a timetable.

---

## 🏆 Hackathon Project

DHANU STUDY OS was created as a student-focused AI learning project for the **CSC Back-to-School Hackathon 2026**.

The project explores how AI can become a practical study companion instead of simply another chatbot: helping students plan, focus, practise, identify what needs attention, and improve over time.

---

## 👤 Creator

**Dhanush / Dhanush Creations**

Built with a focus on AI, web development, education, and practical digital products.

---

## 📄 License

This project is available under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>DHANU STUDY OS</strong><br>
  Think · Learn · Evolve
</p>
