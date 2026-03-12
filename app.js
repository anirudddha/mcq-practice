let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // Store { question, userAnswer, isCorrect, correctAnswer }

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const viewScreen = document.getElementById('view-screen');

const startBtn = document.getElementById('start-btn');
const viewBtn = document.getElementById('view-btn');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');
const testSelect = document.getElementById('test-select');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressFill = document.getElementById('progress-fill');
const questionStats = document.getElementById('question-stats');
const categoryBadge = document.getElementById('category-badge');

const scoreText = document.getElementById('score-text');
const reviewContainer = document.getElementById('review-container');
const allQuestionsContainer = document.getElementById('all-questions-container');

// Initialization
function init() {
    startBtn.addEventListener('click', () => handleStartAction('quiz'));
    viewBtn.addEventListener('click', () => handleStartAction('view'));

    restartBtn.addEventListener('click', () => {
        showScreen('start-screen');
    });
    backBtn.addEventListener('click', () => {
        showScreen('start-screen');
    });
}

async function fetchQuestions() {
    try {
        const file = testSelect.value;
        const response = await fetch(file);
        allQuestions = await response.json();
    } catch (error) {
        console.error("Error loading questions:", error);
        alert("Failed to load questions from selected file.");
    }
}

// Utility: Fisher-Yates Shuffle
function shuffleArray(array) {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    // reset scroll for result screen if needed
    if (screenId === 'result-screen') {
        document.getElementById(screenId).scrollTop = 0;
    }
}

async function handleStartAction(actionType) {
    // Fetch newly selected file
    await fetchQuestions();

    if (allQuestions.length === 0) return;

    if (actionType === 'quiz') {
        startQuiz();
    } else if (actionType === 'view') {
        startViewAll();
    }
}

function startQuiz() {
    if (allQuestions.length === 0) return;

    // Reset state
    currentQuestions = shuffleArray(allQuestions);
    // Shuffle options for each question as well
    currentQuestions.forEach(q => {
        q.shuffledOptions = shuffleArray(q.options);
    });

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];

    showScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    const q = currentQuestions[currentQuestionIndex];

    // Update UI
    questionText.innerText = q.question;
    categoryBadge.innerText = q.category;
    questionStats.innerText = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;

    // Update Progress
    const progress = ((currentQuestionIndex) / currentQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;

    // Clear and render options
    optionsContainer.innerHTML = '';

    q.shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(opt, q.answer);
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selected, correct) {
    const isCorrect = selected === correct;
    if (isCorrect) score++;

    userAnswers.push({
        questionObj: currentQuestions[currentQuestionIndex],
        userAnswer: selected,
        isCorrect: isCorrect,
        correctAnswer: correct
    });

    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    progressFill.style.width = '100%';

    setTimeout(() => {
        showScreen('result-screen');
        renderResult();
    }, 400); // small delay to show final progress bar completion
}

function renderResult() {
    scoreText.innerText = `${score} / ${currentQuestions.length}`;

    reviewContainer.innerHTML = '';

    userAnswers.forEach((ans, index) => {
        const item = document.createElement('div');
        item.classList.add('review-item');
        if (ans.isCorrect) item.classList.add('correct');

        let ansHtml = `
            <div class="review-question">${index + 1}. ${ans.questionObj.question}</div>
        `;

        if (ans.isCorrect) {
            ansHtml += `
             <div class="review-answer">
                <span class="ans-label">Your Answer:</span>
                <span class="correct-ans">${ans.userAnswer} ✓</span>
             </div>
             `;
        } else {
            ansHtml += `
             <div class="review-answer">
                <span class="ans-label">Your Answer:</span>
                <span class="user-wrong">${ans.userAnswer} ✗</span>
             </div>
             <div class="review-answer">
                <span class="ans-label">Correct:</span>
                <span class="correct-ans">${ans.correctAnswer}</span>
             </div>
             `;
        }

        item.innerHTML = ansHtml;
        reviewContainer.appendChild(item);
    });
}

function startViewAll() {
    currentQuestions = allQuestions; // No shuffle for viewer
    showScreen('view-screen');
    renderViewAll();
}

function renderViewAll() {
    allQuestionsContainer.innerHTML = '';

    currentQuestions.forEach((q, index) => {
        const block = document.createElement('div');
        block.classList.add('view-q-block');

        let html = `
            <div class="view-q-text">
                <span style="flex:1;">${index + 1}. ${q.question}</span>
                <span class="badge" style="white-space: nowrap;">${q.category}</span>
            </div>
            <div class="view-options">
        `;

        q.options.forEach(opt => {
            const isAns = opt === q.answer;
            const cls = isAns ? 'view-opt is-answer' : 'view-opt';
            const icon = isAns ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';
            html += `<div class="${cls}"><span>${opt}</span>${icon}</div>`;
        });

        html += `</div>`;
        block.innerHTML = html;
        allQuestionsContainer.appendChild(block);
    });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
