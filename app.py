from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from datetime import datetime
import os
import requests

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this to a secure random string!

MOOD_DATA = []

# Dummy user credentials for demo purpose
VALID_USERNAME = "student"
VALID_PASSWORD = "password123"

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == VALID_USERNAME and password == VALID_PASSWORD:
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('main'))
        else:
            error = "Invalid username or password"
            return render_template('login.html', error=error)
    else:
        return render_template('login.html')

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route("/")
def main():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template("index.html")

@app.route('/api/mood', methods=['POST'])
def save_mood():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    MOOD_DATA.append({
        'mood': data['mood'],
        'note': data.get('note', ''),
        'date': datetime.now().strftime('%A')
    })
    return jsonify({'status': 'ok'})

@app.route('/api/mood/trends')
def mood_trends():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    dummy_trends = {
        'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        'levels': [3, 4, 3, 5, 4, 5, 4],
    }
    return jsonify(dummy_trends)

@app.route('/api/chat', methods=['POST'])
def chat():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    msg = request.json['message']
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
