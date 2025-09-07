// Mood Selection
let selectedMood = null;
const moodBtns = document.querySelectorAll('.mood-btn');
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
  });
});

document.getElementById('saveMood').addEventListener('click', async () => {
  const note = document.getElementById('mood-note').value.trim();
  if (!selectedMood) {
    alert('Please select a mood before saving.');
    return;
  }
  await fetch('/api/mood', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood: selectedMood, note }),
  });
  alert('Mood saved successfully');
});

// Chart.js Mood Trend initialization
let moodChart;
fetch('/api/mood/trends')
  .then(res => res.json())
  .then(data => {
    const ctx = document.getElementById('moodChart').getContext('2d');
    moodChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Mood Level',
          data: data.levels,
          backgroundColor: 'rgba(186, 134, 11, 0.15)',
          borderColor: '#b886b',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 4,
            ticks: {
              stepSize: 1,
              callback: val => ['None', 'Low', 'Moderate', 'High', 'Very High'][val] || val,
            }
          }
        }
      }
    });
  });

// Chat Assistant Voice and Text Handling
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  speechSynthesis.speak(utter);
}

let recognition;
if ('webkitSpeechRecognition' in window) recognition = new webkitSpeechRecognition();
else if ('SpeechRecognition' in window) recognition = new SpeechRecognition();

if (recognition) {
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chatInput');
    input.value = transcript;
    input.form.requestSubmit();
  };
  recognition.onerror = e => alert(`Speech Recognition error: ${e.error}`);
}

const micBtn = document.getElementById('micBtn');
if (micBtn) micBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
  else alert('Speech recognition not supported');
});

const chatBox = document.getElementById('chatBox');
document.getElementById('chatForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  chatBox.insertAdjacentHTML('beforeend', `<div class="user-msg">${msg}</div>`);
  input.value = '';
  chatBox.insertAdjacentHTML('beforeend', `<div class="bot-msg">...</div>`);
  chatBox.scrollTop = chatBox.scrollHeight;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg }),
  });
  const json = await response.json();
  const botMsg = chatBox.querySelector('.bot-msg:last-child');
  botMsg.textContent = json.reply;
  chatBox.scrollTop = chatBox.scrollHeight;

  speak(json.reply);
});

// Mental Health Assessment Setup
const assessments = {
  anxiety: [
    'Over the last two weeks, how often have you felt nervous, anxious, or on edge?',
    'Over the last two weeks, how often have you felt unable to stop worrying?',
    'Over the last two weeks, how often have you felt restless or unable to sit still?',
    'Over the last two weeks, how often have you felt easily annoyed or irritable?',
    'Over the last two weeks, how often have you felt afraid that something awful might happen?'
  ],
  depression: [
    'Over the last two weeks, how often have you felt down or hopeless?',
    'Over the last two weeks, how often have you had little interest or pleasure in doing things?',
    'Over the last two weeks, how often have you had trouble sleeping?',
    'Over the last two weeks, how often have you felt tired or had low energy?',
    'Over the last two weeks, how often have you felt worthless or guilty?'
  ],
  stress: [
    'Over the last month, how often have you felt overwhelmed?',
    'Over the last month, how often have you felt nervous or tense?',
    'Over the last month, how often have you felt difficulties piling up and overwhelming you?'
  ]
};

let currentAssessment = 'anxiety';
let currentQuestion = 0;
let answers = [];

function renderAssessment() {
  const questions = assessments[currentAssessment];
  if (currentQuestion >= questions.length) {
    showAssessmentResult();
    return;
  }
  const container = document.getElementById('assessmentContent');
  container.innerHTML = `
    <div>
      <strong>Question ${currentQuestion + 1} of ${questions.length}</strong>
      <p style="margin: 16px 0;">${questions[currentQuestion]}</p>
      <form id="assessmentForm">
        <label><input type="radio" name="ans" value="0" required> Not at all</label><br>
        <label><input type="radio" name="ans" value="1"> Several days</label><br>
        <label><input type="radio" name="ans" value="2"> More than half the days</label><br>
        <label><input type="radio" name="ans" value="3"> Nearly every day</label><br>
        <button type="submit" style="margin-top:12px; padding: 8px 18px; border:none; border-radius:8px; background-color: var(--accent); color:#fff;">Next</button>
      </form>
    </div>
  `;
  document.getElementById('assessmentForm').addEventListener('submit', e => {
    e.preventDefault();
    const val = e.target.ans.value;
    answers.push(Number(val));
    currentQuestion++;
    renderAssessment();
  });
}

function showAssessmentResult() {
  const total = answers.reduce((a, b) => a + b, 0);
  let interpretation = '';
  if (total <= 9) interpretation = "Minimal or no symptoms.";
  else if (total <= 18) interpretation = "Mild symptoms; monitor and self-care.";
  else if (total <= 27) interpretation = "Moderate symptoms; consider seeking professional help.";
  else interpretation = "Severe symptoms; immediate professional consultation recommended.";

  const container = document.getElementById('assessmentContent');
  container.innerHTML = `
    <div>
      <h3>Assessment Complete</h3>
      <p>Your total score is <strong>${total}</strong>.</p>
      <p>${interpretation}</p>
      <button id="restartAssessment" style="margin-top: 12px; padding: 8px 18px; border: none; border-radius: 8px; background-color: var(--accent); color: #fff;">Retake</button>
    </div>
  `;
  document.getElementById('restartAssessment').addEventListener('click', () => {
    currentQuestion = 0;
    answers = [];
    renderAssessment();
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAssessment = btn.dataset.tab;
    currentQuestion = 0;
    answers = [];
    renderAssessment();
  });
});

// Initialize Assessment on page load
renderAssessment();

// Theme Toggle Logic
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const modeLabel = document.querySelector('.mode-label');

themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    body.classList.add('dark');
    modeLabel.textContent = 'Dark Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark');
    modeLabel.textContent = 'Light Mode';
    localStorage.setItem('theme', 'light');
  }
});

if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
  themeToggle.checked = true;
  modeLabel.textContent = 'Dark Mode';
}
