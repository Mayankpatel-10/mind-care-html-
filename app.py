from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import requests

app = Flask(__name__)

MOOD_DATA = []

@app.route("/")
def main():
    return render_template("index.html")

@app.route('/api/mood', methods=['POST'])
def save_mood():
    data = request.json
    MOOD_DATA.append({
        'mood': data['mood'],
        'note': data.get('note', ''),
        'date': datetime.now().strftime('%A')
    })
    return jsonify({'status': 'ok'})

@app.route('/api/mood/trends')
def mood_trends():
    # Demo data: levels 1-5 (1=awful, 5=great)
    dummy_trends = {
        'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        'levels': [3, 4, 3, 5, 4, 5, 4],
    }
    return jsonify(dummy_trends)

@app.route('/api/chat', methods=['POST'])
def chat():
    msg = request.json['message']
    # Replace this with your Gemini API details
    api_key = os.getenv('GEMINI_API_KEY')
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    data = {
        "contents": [
            {"role": "user", "parts": [{"text": msg}]}
        ]
    }
    gemini_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    r = requests.post(gemini_url, headers=headers, json=data)
    if r.ok:
        reply = r.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sorry, no response.')
        return jsonify({"reply": reply})
    else:
        return jsonify({"reply": "Error contacting Gemini API."})

if __name__ == "__main__":
    app.run(debug=True)
