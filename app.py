import json
import os
from datetime import date
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def demo_plan(topic, days, minutes=90, confidence="Not sure", exam_date="Not set"):
    intensity = "light" if minutes < 60 else "focused" if minutes < 120 else "deep"
    templates = [
        ("Understand before memorising", ["Identify the most important ideas", "Study one concept", "Close your notes and recall it"]),
        ("Practice the weak spots", ["Review yesterday's recall", "Solve 5–10 questions", "Write down every mistake"]),
        ("Active recall", ["Explain the topic without notes", "Test yourself", "Revisit only the gaps"]),
        ("Exam-style practice", ["Do a timed mini test", "Check mistakes", "Create a revision list"]),
        ("Confidence check", ["Recall the whole topic", "Redo hard questions", "Choose what needs another revision"]),
        ("Targeted revision", ["Spend time on your weakest topic", "Use short recall cycles", "Finish with a brain dump"]),
        ("Ready, not exhausted", ["Take a final self-test", "Review mistakes only", "Protect your sleep"]),
    ]
    items = []
    for index in range(max(1, min(days, 30))):
        title, tasks = templates[index % len(templates)]
        items.append({"day": index + 1, "title": title, "tasks": tasks})
    return {
        "title": f"Your {days}-day plan for {topic}",
        "mode": "Demo mode",
        "coach": f"You have {minutes} minutes per day, so this plan stays {intensity} and realistic.",
        "items": items,
        "exam_date": exam_date,
    }


def demo_quiz(topic):
    return {"title": f"5-question check: {topic}", "mode": "Demo mode", "questions": [
        {"q": f"What is the main idea of {topic}?", "options": ["I can explain the core idea", "I partly remember it", "I don't know yet", "I only recognise the heading"], "answer": 0},
        {"q": f"Which approach is best when learning {topic}?", "options": ["Understand and practise", "Only reread", "Only memorise headings", "Wait until the exam"], "answer": 0},
        {"q": f"How should you handle a mistake in {topic}?", "options": ["Analyse it and retry", "Skip it", "Guess without checking", "Erase it and move on"], "answer": 0},
        {"q": f"What best proves you understand {topic}?", "options": ["Solving an unseen question", "Recognising a page", "Reading it again", "Highlighting everything"], "answer": 0},
        {"q": f"What should happen after a weak practice result?", "options": ["Schedule targeted revision", "Ignore the topic", "Start a random chapter", "Stop studying it"], "answer": 0},
    ]}


def ai_client():
    from openai import OpenAI
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "ai_configured": bool(os.getenv("OPENAI_API_KEY"))})


@app.post("/api/plan")
def create_plan():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "My subjects").strip()[:6000]
    days = max(1, min(int(data.get("days") or 5), 30))
    minutes = max(15, min(int(data.get("minutes") or 90), 480))
    confidence = (data.get("confidence") or "Not sure").strip()[:50]
    exam_date = (data.get("exam_date") or "Not set").strip()[:30]

    if not os.getenv("OPENAI_API_KEY"):
        return jsonify(demo_plan(topic, days, minutes, confidence, exam_date))

    try:
        response = ai_client().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=(
                "You are DHANU STUDY OS, a practical AI study coach. "
                "Use the student's REAL subject/topic list below; never invent unrelated subjects. "
                "Build a realistic plan around available time. Prioritise active recall, practice, mistakes and spaced revision. "
                f"Student topics: {topic}\nDays requested: {days}\nMinutes/day: {minutes}\n"
                f"Self-rated confidence: {confidence}\nExam date: {exam_date}\n"
                "Return ONLY valid JSON with keys title, mode, coach, items. "
                "items must contain exactly the requested number of day objects, each with day, title and 2-4 task strings."
            ),
        )
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": "AI planner unavailable", "message": "The AI call failed. Please retry in a moment."}), 502


@app.post("/api/quiz")
def create_quiz():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "my current topic").strip()[:1200]
    material = (data.get("material") or "").strip()[:2000]
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify(demo_quiz(topic))
    try:
        response = ai_client().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=(
                f"Create exactly 5 multiple-choice questions for a student studying {topic}. "
                f"Optional material names/context: {material}. Test understanding, not trivia. "
                "Return ONLY valid JSON with title, mode, questions. Each question must have q, options (4 strings), and answer (zero-based integer)."
            ),
        )
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception:
        return jsonify({"error": "AI practice unavailable", "message": "The Practice Lab could not generate questions. Please retry."}), 502


@app.post("/api/coach")
def coach():
    data = request.get_json(silent=True) or {}
    context = (data.get("context") or "student's current study situation").strip()[:3000]
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"mode": "Demo mode", "message": "Pick one small, finishable task. Then use recall or practice to prove it stuck."})
    try:
        response = ai_client().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=(
                "You are the DHANU STUDY OS AI Study Coach. Give one empathetic, practical next step to a student. "
                "Keep it under 45 words and do not shame the student. Return ONLY JSON with keys mode and message. "
                f"Context: {context}"
            ),
        )
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception:
        return jsonify({"error": "AI coach unavailable", "message": "The AI Study Coach could not respond. Please retry."}), 502


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
