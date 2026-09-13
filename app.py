import os
import json
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def demo_plan(topic: str, days: int, minutes: int = 90, confidence: str = "Not sure"):
    intensity = "light" if minutes < 60 else "focused" if minutes < 120 else "deep"
    return {
        "title": f"Your {days}-day plan for {topic}",
        "mode": "Demo mode",
        "coach": f"You have {minutes} minutes per day, so this plan keeps each session {intensity} and realistic.",
        "items": [
            {"day": 1, "title": "Understand before memorising", "tasks": ["Identify the 3 most important ideas", "Study one concept in a focused block", "Close your notes and recall what you learned"]},
            {"day": 2, "title": "Practice the weak spots", "tasks": ["Review yesterday's recall", "Solve 5–10 questions", "Write down every mistake or doubt"]},
            {"day": 3, "title": "Active recall", "tasks": ["Explain the topic without notes", "Test yourself with short questions", "Revisit only the gaps you missed"]},
            {"day": 4, "title": "Exam-style practice", "tasks": ["Do a timed mini test", "Check mistakes before checking answers", "Create a last-minute revision list"]},
            {"day": 5, "title": "Confidence check", "tasks": ["Recall the whole topic from memory", "Redo your hardest questions", "Choose what needs one more revision"]},
            {"day": 6, "title": "Targeted revision", "tasks": ["Spend most time on your lowest-confidence topic", "Use short recall cycles", "Finish with a 5-minute brain dump"]},
            {"day": 7, "title": "Ready, not exhausted", "tasks": ["Take a calm final self-test", "Review mistakes only", "Stop early and protect your sleep"]},
        ][:max(1, min(days, 7))]
    }


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
        prompt = f"""You are DHANU STUDY OS, a practical AI study coach for school students.
Do not make the student feel guilty or overloaded. Build a realistic plan around their actual time.
Prioritise active recall, practice, mistakes and spaced revision instead of passive rereading.

Student mission: {topic}
Days available: {days}
Minutes available per day: {minutes}
Self-rated confidence: {confidence}
Exam date: {exam_date}

Return ONLY valid JSON with keys: title, mode, coach, items.
items must contain objects with day, title, tasks (array of 2-4 concise strings).
Make the plan specific to the student's mission and time. Include a final review/checkpoint.
"""
        response = client.responses.create(model=model, input=prompt)
        result = json.loads(response.output_text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception:
        return jsonify(demo_plan(topic, days, minutes, confidence))


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
