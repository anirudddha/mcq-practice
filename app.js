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

const codingPracticeBtn = document.getElementById('coding-practice-btn');
const codingScreen = document.getElementById('coding-screen');
const codingBackBtn = document.getElementById('coding-back-btn');
const languageSelect = document.getElementById('language-select');
const questionSelect = document.getElementById('question-select');
const runCodeBtn = document.getElementById('run-code-btn');
let allCodingQuestions = [];
const codingDifficulty = document.getElementById('coding-difficulty');
const codingDescription = document.getElementById('coding-description');
const codingOutputTerminal = document.getElementById('coding-output-terminal');
const codeEditorTextarea = document.getElementById('code-editor');
let codeMirrorEditor = null;
let currentCodingQuestion = null;

let leftRightSplit = null;
let topBottomSplit = null;
const codingFullscreenBtn = document.getElementById('coding-fullscreen-btn');
let isFullscreen = false;

let pyodideInstance = null;

async function initPyodide() {
    if (!pyodideInstance) {
        codingOutputTerminal.innerText = "Downloading Python engine (this takes a few seconds the first time)...\n";
        codingOutputTerminal.className = "terminal-box";
        pyodideInstance = await loadPyodide();
        codingOutputTerminal.innerText = "Python engine ready!\n";
    }
}

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
    
    if (codingPracticeBtn) codingPracticeBtn.addEventListener('click', () => startCodingPractice('coding_questions.json'));
    const apiPracticeBtn = document.getElementById('api-practice-btn');
    if (apiPracticeBtn) apiPracticeBtn.addEventListener('click', () => startCodingPractice('api_questions.json'));
    
    if (codingBackBtn) codingBackBtn.addEventListener('click', () => showScreen('start-screen'));
    
    if (codingFullscreenBtn) {
        codingFullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            if(currentCodingQuestion) {
                const lang = languageSelect.value;
                setEditorMode(lang);
                codeMirrorEditor.setValue(currentCodingQuestion.starterCode[lang] || "");
            }
        });
    }

    if (questionSelect) {
        questionSelect.addEventListener('change', () => {
            const index = parseInt(questionSelect.value);
            currentCodingQuestion = allCodingQuestions[index];
            setupCodingScreen();
        });
    }

    if (runCodeBtn) runCodeBtn.addEventListener('click', runCode);

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

    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        if (screenId === 'coding-screen') {
            appContainer.classList.add('coding-mode');
        } else {
            appContainer.classList.remove('coding-mode');
        }
    }

    // reset scroll for result screen if needed
    if (screenId === 'result-screen') {
        document.getElementById(screenId).scrollTop = 0;
    }
}

function toggleFullscreen() {
    const appContainer = document.querySelector('.app-container');
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        appContainer.classList.add('fullscreen');
        codingFullscreenBtn.innerText = "Exit Full Screen";
    } else {
        appContainer.classList.remove('fullscreen');
        codingFullscreenBtn.innerText = "Full Screen";
    }
    // Refresh CodeMirror after animation
    setTimeout(() => {
        if (codeMirrorEditor) codeMirrorEditor.refresh();
    }, 350);
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

async function startCodingPractice(filename = 'coding_questions.json') {
    try {
        const response = await fetch(filename);
        allCodingQuestions = await response.json();
        if(allCodingQuestions.length > 0) {
            if (questionSelect) {
                questionSelect.innerHTML = '';
                allCodingQuestions.forEach((q, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.innerText = q.title;
                    questionSelect.appendChild(opt);
                });
                questionSelect.value = 0;
            }
            
            currentCodingQuestion = allCodingQuestions[0];
            showScreen('coding-screen');
            setupCodingScreen();
            setupSplitPanes();
        }
    } catch (e) {
        console.error("Failed to load coding questions", e);
        alert("Failed to load coding questions.");
    }
}

function setupSplitPanes() {
    if (!leftRightSplit) {
        setTimeout(() => {
            leftRightSplit = Split(['#split-left', '#split-right'], {
                sizes: [40, 60],
                minSize: [300, 300],
                gutterSize: 8,
                onDragEnd: () => { if (codeMirrorEditor) codeMirrorEditor.refresh(); }
            });
            topBottomSplit = Split(['#split-top', '#split-bottom'], {
                direction: 'vertical',
                sizes: [70, 30],
                minSize: [150, 100],
                gutterSize: 8,
                onDragEnd: () => { if (codeMirrorEditor) codeMirrorEditor.refresh(); }
            });
            if (codeMirrorEditor) codeMirrorEditor.refresh();
        }, 100); // small delay to let display: flex apply
    }
}

function setupCodingScreen() {
    codingDifficulty.innerText = currentCodingQuestion.difficulty;
    codingDescription.innerText = currentCodingQuestion.description;
    codingOutputTerminal.innerText = "Ready to run...";
    codingOutputTerminal.className = "terminal-box";

    if (!codeMirrorEditor) {
        codeMirrorEditor = CodeMirror.fromTextArea(codeEditorTextarea, {
            lineNumbers: true,
            theme: 'dracula',
            mode: 'python',
            indentUnit: 4,
            matchBrackets: true,
            autoCloseBrackets: true
        });
    }
    
    // Force refresh to fix layout issues when initializing in a hidden div
    setTimeout(() => codeMirrorEditor.refresh(), 50);
    
    languageSelect.value = "python3";
    setEditorMode("python3");
    codeMirrorEditor.setValue(currentCodingQuestion.starterCode["python3"]);
}

function setEditorMode(lang) {
    if(lang === 'python3') codeMirrorEditor.setOption("mode", "python");
    else if(lang === 'javascript') codeMirrorEditor.setOption("mode", "javascript");
}

async function executeCode(code, language, input) {
    let resultOutput = "";
    let resultError = null;
    
    if (language === 'python3') {
        try {
            // Inject input securely
            pyodideInstance.globals.set("test_input", input);
            
            pyodideInstance.runPython(`
import sys
import io
sys.stdin = io.StringIO(test_input)
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
            `);
            
            // Run code
            pyodideInstance.runPython(code);
            
            resultOutput = pyodideInstance.runPython(`sys.stdout.getvalue()`);
            const pyStderr = pyodideInstance.runPython(`sys.stderr.getvalue()`);
            if (pyStderr) resultError = pyStderr;
            
        } catch (err) {
            resultError = err.message;
        }
    } else if (language === 'javascript') {
        let outputBuffer = "";
        const mockConsole = {
            log: (...args) => {
                outputBuffer += args.join(" ") + "\n";
            }
        };
        
        try {
            // Create isolated function environment
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const runJS = new AsyncFunction('input', 'console', code);
            await runJS(input, mockConsole);
            resultOutput = outputBuffer;
        } catch (err) {
            resultError = err.message;
        }
    }
    return { output: resultOutput, error: resultError };
}

async function runCode() {
    runCodeBtn.disabled = true;
    runCodeBtn.innerText = "Running...";
    codingOutputTerminal.className = "terminal-box";
    const runLoader = document.getElementById('run-loader');
    if(runLoader) runLoader.style.display = 'inline-block';
    
    codingOutputTerminal.innerText = "Compiling and executing...\n";

    const code = codeMirrorEditor.getValue();
    const language = languageSelect.value;

    let passedAll = true;
    let outputText = "";

    if (language === 'python3') {
        try {
            await initPyodide();
        } catch (e) {
            codingOutputTerminal.innerText = "Failed to load Python engine.\n" + e.message;
            codingOutputTerminal.className = "terminal-box error";
            runCodeBtn.disabled = false;
            runCodeBtn.innerText = "Run Code";
            if(runLoader) runLoader.style.display = 'none';
            return;
        }
    }

    // Yield control back to the browser so it can render the spinner and text
    await new Promise(resolve => setTimeout(resolve, 50));

    for (let i = 0; i < currentCodingQuestion.testCases.length; i++) {
        const tc = currentCodingQuestion.testCases[i];
        
        // Yield between test cases to keep the spinner animating
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
            // Check if we need to dynamically evaluate the expected output
            let expectedOutput = tc.expectedOutput ? tc.expectedOutput.trim() : "";
            
            if (!expectedOutput && currentCodingQuestion.referenceCode && currentCodingQuestion.referenceCode[language]) {
                const refRes = await executeCode(currentCodingQuestion.referenceCode[language], language, tc.input);
                if (refRes.error) {
                    outputText += `Test Case ${i+1}: ✗ Reference Code Error\n${refRes.error}\n\n`;
                    passedAll = false;
                    break;
                }
                expectedOutput = refRes.output ? refRes.output.trim() : "";
            }

            // Execute user code
            const userRes = await executeCode(code, language, tc.input);

            if (userRes.error) {
                outputText += `Test Case ${i+1}: ✗ Error\n${userRes.error}\n\n`;
                passedAll = false;
                break;
            }

            const actualOutput = userRes.output ? userRes.output.trim() : "";

            if (actualOutput === expectedOutput) {
                outputText += `Test Case ${i+1}: ✓ Passed\n`;
            } else {
                outputText += `Test Case ${i+1}: ✗ Failed\nExpected:\n${expectedOutput}\nActual:\n${actualOutput}\n\n`;
                passedAll = false;
            }
            
        } catch (e) {
            outputText += `Test Case ${i+1}: ✗ Execution Error\n${e.message}\n\n`;
            passedAll = false;
            break;
        }
    }

    if (passedAll) {
        outputText += "\n✨ ALL TEST CASES PASSED! ✨";
        codingOutputTerminal.className = "terminal-box";
    } else {
        codingOutputTerminal.className = "terminal-box error";
    }

    codingOutputTerminal.innerText = outputText;
    runCodeBtn.disabled = false;
    runCodeBtn.innerText = "Run Code";
    if(runLoader) runLoader.style.display = 'none';
}

// Start app
document.addEventListener('DOMContentLoaded', init);
