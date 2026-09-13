import os
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def demo_plan(topic: str, days: int):
    return {
        "title": f"{topic} — {days}-day study plan",
        "mode": "Demo mode",
        "items": [
            {"day": 1, "title": "Understand the basics", "tasks": ["Read the core concepts", "Write 5 key points", "Do a 10-minute recall"]},
            {"day": 2, "title": "Practice", "tasks": ["Review yesterday's notes", "Solve practice questions", "Mark difficult areas"]},
            {"day": 3, "title": "Active recall", "tasks": ["Test yourself without notes", "Explain the topic in simple words", "Fix knowledge gaps"]},
            {"day": 4, "title": "Revision", "tasks": ["Review key formulas/facts", "Complete a short quiz", "Create a one-page summary"]},
            {"day": 5, "title": "Final check", "tasks": ["Take a timed practice test", "Review mistakes", "Plan the next revision"]},
        ][:max(1, min(days, 5))]
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
    topic = (data.get("topic") or "My syllabus").strip()[:500]
    days = int(data.get("days") or 5)

    # Safe first version: works even before an API key is configured.
    # The real AI integration will be enabled server-side with OPENAI_API_KEY.
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify(demo_plan(topic, days))

    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response = client.responses.create(
            model=model,
            input=(
                "You are a student study planner. Create a practical, concise study plan. "
                f"Topic/syllabus: {topic}\nDays: {days}\n"
                "Return JSON with keys title, mode, items. items must be an array of objects "
                "with day, title, and tasks (array of strings)."
            ),
        )
        text = response.output_text
        import json
        result = json.loads(text)
        result["mode"] = "AI mode"
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": "AI request failed", "detail": str(exc), **demo_plan(topic, days)}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
