let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // Store { question, userAnswer, isCorrect, correctAnswer }

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const authCodeInput = document.getElementById('auth-code');
const authError = document.getElementById('auth-error');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressFill = document.getElementById('progress-fill');
const questionStats = document.getElementById('question-stats');
const categoryBadge = document.getElementById('category-badge');

const scoreText = document.getElementById('score-text');
const reviewContainer = document.getElementById('review-container');

// Initialization
async function init() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
    } catch (error) {
        console.error("Error loading questions:", error);
        questionText.innerText = "Failed to load questions.";
    }

    startBtn.addEventListener('click', startQuiz);
    restartBtn.addEventListener('click', () => {
        showScreen('start-screen');
    });
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

function startQuiz() {
    if (allQuestions.length === 0) return;

    // Auth Check
    const code = authCodeInput.value.trim().toLowerCase();
    if (code !== '555' && code !== 'thank you aniruddha') {
        authError.innerText = "Incorrect code or phrase.";
        return;
    }

    authError.innerText = "";

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

// Start app
document.addEventListener('DOMContentLoaded', init);
