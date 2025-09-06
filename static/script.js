// Mood Selection
let selectedMood = null;
const moodBtns = document.querySelectorAll('.mood-btn');
moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        moodBtns.forEach(bt => bt.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.dataset.mood;
    });
});

// Save Mood
document.getElementById('saveMood').addEventListener('click', async () => {
    const note = document.getElementById('mood-note').value;
    if (!selectedMood) {
        alert("Select a mood first!");
        return;
    }
    await fetch('/api/mood', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, note: note })
    });
    alert("Mood saved!");
});

// Chart.js Mood Trend
let moodChart = null;
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
                    backgroundColor: 'rgba(82, 86, 249, 0.23)',
                    borderColor: 'rgba(82, 86, 249, 1)',
                    fill: true,
                    tension: 0.35
                }]
            }
        });
    });

// Relaxation Station Sounds
const sounds = {
    nature: "/static/nature.mp3",
    rain: "/static/rain.mp3",
    meditation: "/static/meditation.mp3"
};
document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('relaxAudio').src = sounds[btn.dataset.sound];
        document.getElementById('relaxAudio').play();
    });
});

// Chat Assistant Gemini API (calls Flask backend)
const chatBox = document.getElementById('chatBox');
document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(msg==='') return;
    chatBox.innerHTML += `<div class="user-msg">${msg}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    chatBox.innerHTML += `<div class="bot-msg">...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    });
    const json = await response.json();
    const botMsgEl = document.querySelector(".bot-msg:last-child");
    botMsgEl.textContent = json.reply;
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Assessments (dummy content, implement real logic as needed)
const assessments = {
    anxiety: [
        "How often have you felt nervous, anxious, or on edge over the last two weeks?",
        "How often have you been unable to stop worrying?"
    ],
    depression: [
        "How often have you felt down or hopeless during the last 2 weeks?",
        "Have you had little interest or pleasure in doing things?"
    ],
    stress: [
        "How often have you felt stressed or overwhelmed in the past month?"
    ]
};
let currentAssessment = 'anxiety';
let currentQuestion = 0;
function renderAssessment() {
    const questions = assessments[currentAssessment];
    document.getElementById('assessmentContent').innerHTML = `
        <div>
            <strong>Question ${currentQuestion+1}/${questions.length}</strong>
            <p>${questions[currentQuestion]}</p>
            <input type="radio" name="ans" value="0"> Not at all<br>
            <input type="radio" name="ans" value="1"> Several days<br>
            <input type="radio" name="ans" value="2"> More than half the days<br>
            <input type="radio" name="ans" value="3"> Nearly every day<br>
            <button onclick="nextAssessmentQuestion()">Next Question</button>
        </div>`;
}
window.nextAssessmentQuestion = function() {
    const questions = assessments[currentAssessment];
    currentQuestion++;
    if(currentQuestion >= questions.length) {
        document.getElementById('assessmentContent').innerHTML = '<p>Assessment complete. Results processing coming soon.</p>';
        currentQuestion = 0;
        return;
    }
    renderAssessment();
};
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        currentAssessment = btn.dataset.tab;
        currentQuestion = 0;
        renderAssessment();
    });
});
renderAssessment();

// Theme toggle elements
const themeToggle = document.getElementById('themeToggle');
const modeLabel = document.querySelector('.mode-label');

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  themeToggle.checked = true;
  modeLabel.textContent = 'Dark Mode';
} else {
  modeLabel.textContent = 'Light Mode';
}

// Update theme on toggle
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('dark-theme');
        modeLabel.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        modeLabel.textContent = 'Light Mode';
        localStorage.setItem('theme', 'light');
    }
});
