import os
import json
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def demo_plan(topic, days, minutes=90, confidence="Not sure"):
    intensity = "light" if minutes < 60 else "focused" if minutes < 120 else "deep"
    items = [
        {"day": 1, "title": "Understand before memorising", "tasks": ["Identify the 3 most important ideas", "Study one concept", "Close your notes and recall it"]},
        {"day": 2, "title": "Practice the weak spots", "tasks": ["Review yesterday's recall", "Solve 5–10 questions", "Write down every mistake"]},
        {"day": 3, "title": "Active recall", "tasks": ["Explain the topic without notes", "Test yourself", "Revisit only the gaps"]},
        {"day": 4, "title": "Exam-style practice", "tasks": ["Do a timed mini test", "Check mistakes", "Create a revision list"]},
        {"day": 5, "title": "Confidence check", "tasks": ["Recall the whole topic", "Redo hard questions", "Choose what needs another revision"]},
        {"day": 6, "title": "Targeted revision", "tasks": ["Spend time on your weakest topic", "Use short recall cycles", "Finish with a brain dump"]},
        {"day": 7, "title": "Ready, not exhausted", "tasks": ["Take a final self-test", "Review mistakes only", "Protect your sleep"]}
    ]
    return {"title": f"Your {days}-day plan for {topic}", "mode": "Demo mode", "coach": f"You have {minutes} minutes per day, so this plan stays {intensity} and realistic.", "items": items[:max(1, min(days, 7))]}


def demo_quiz(topic):
    return {"title": f"5-question check: {topic}", "mode": "Demo mode", "questions": [
        {"q": f"What is the main idea of {topic}?", "options": ["I can explain the core idea", "I partly remember it", "I don't know yet"], "answer": 0},
        {"q": f"Which approach is best when learning {topic}?", "options": ["Understand and practise", "Only reread", "Only memorise headings"], "answer": 0},
        {"q": f"How should you handle a mistake in {topic}?", "options": ["Analyse it and retry", "Skip it", "Guess without checking"], "answer": 0},
        {"q": f"What proves you understand {topic}?", "options": ["Solving an unseen question", "Recognising a page", "Reading it again"], "answer": 0},
        {"q": f"What should happen after a weak practice result?", "options": ["Schedule targeted revision", "Ignore the topic", "Start a random chapter"], "answer": 0}
    ]}


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "ai_configured": bool(os.getenv("OPENAI_API_KEY"))})


@app.post("/api/plan")
def create_plan():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "My syllabus").strip()[:1200]
    days = max(1, min(int(data.get("days") or 5), 30))
    minutes = max(15, min(int(data.get("minutes") or 90), 480))
    confidence = (data.get("confidence") or "Not sure").strip()[:50]
    exam_date = (data.get("exam_date") or "Not set").strip()[:30]
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify(demo_plan(topic, days, minutes, confidence))
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        prompt = f"""You are DHANU STUDY OS, a practical AI study coach.
Build a realistic plan around actual time. Prioritise active recall, practice, mistakes and spaced revision.
Student mission: {topic}
Days: {days}
Minutes/day: {minutes}
Self-rated confidence: {confidence}
Exam date: {exam_date}
Return ONLY JSON with keys title, mode, coach, items. Each item has day, title and tasks (2-4 strings)."""
        response = client.responses.create(model=model, input=prompt)
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception:
        return jsonify(demo_plan(topic, days, minutes, confidence))


@app.post("/api/quiz")
def create_quiz():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "my current topic").strip()[:500]
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify(demo_quiz(topic))
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        prompt = f"Create exactly 5 multiple-choice questions for a student studying {topic}. Test understanding, not trivia. Return ONLY JSON with title, mode, questions. Each question must have q, options (4 strings), and answer (zero-based integer)."
        response = client.responses.create(model=model, input=prompt)
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception:
        return jsonify(demo_quiz(topic))


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
