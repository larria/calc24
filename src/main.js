import { Generator } from './generator.js';

const generator = new Generator();

// DOM Elements
const cardsContainer = document.getElementById('cards-container');
const refreshBtn = document.getElementById('refresh-btn');
const solveBtn = document.getElementById('solve-btn');
const solutionsPanel = document.getElementById('solutions-panel');
const solutionsList = document.getElementById('solutions-list');
const solutionCountSpan = document.getElementById('solution-count');
const mascotMessage = document.getElementById('mascot-message');
const antiRoteTip = document.getElementById('anti-rote-tip');

// State
let currentSolutions = [];
let isSolutionsVisible = false;

// Speech Synthesis
let speechUtterance = null;
let speechQueue = [];
let isSpeaking = false;
let shouldStopSpeaking = false;

// Helpers
const SUITS = ['♥', '♦', '♣', '♠'];
const getSuit = () => SUITS[Math.floor(Math.random() * SUITS.length)];
const isRed = (suit) => suit === '♥' || suit === '♦';

const formatNumber = (num) => {
  if (num === 1) return 'A';
  if (num === 11) return 'J';
  if (num === 12) return 'Q';
  if (num === 13) return 'K';
  return num.toString();
};

const convertToSpeakingNumber = (num) => {
  if (num === 11) return '11';
  if (num === 12) return '12';
  if (num === 13) return '13';
  return num.toString();
};

const speakNumbers = (numbers) => {
  // Clear any existing speech queue
  stopSpeech();
  shouldStopSpeaking = false;
  
  // Add each number to the speech queue
  numbers.forEach(num => {
    addToSpeechQueue(convertToSpeakingNumber(num));
  });
};

const MESSAGES = [
  "动动脑筋，在这个小脑袋里算一算！",
  "不要偷看答案，除非你真的试过了！",
  "算错了没关系，再试一次！",
  "你是最棒的数学小天才！",
  "想想看，有什么办法能凑成24？"
];

// Speech Synthesis Functions
function processTextForTTS(text) {
  // Remove emojis
  let processedText = text.replace(/[\u{1F000}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  // Convert math symbols to Chinese characters
  processedText = processedText
    .replace(/\+/g, '加')
    .replace(/-/g, '减')
    .replace(/\*/g, '乘')
    .replace(/\//g, '除')
    .replace(/=/g, '等于');
  
  return processedText;
}

function speak(text, rate = 1, pitch = 1, volume = 1) {
  // Process text for better TTS pronunciation
  const processedText = processTextForTTS(text);
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = 'zh-CN';
    
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    
    speechSynthesis.speak(utterance);
  });
}

async function processSpeechQueue() {
  if (isSpeaking || speechQueue.length === 0 || shouldStopSpeaking) return;
  
  isSpeaking = true;
  
  while (speechQueue.length > 0 && !shouldStopSpeaking) {
    const nextSpeech = speechQueue.shift();
    await speak(nextSpeech);
    // Add a short pause between speeches
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  isSpeaking = false;
}

function addToSpeechQueue(text) {
  speechQueue.push(text);
  processSpeechQueue();
}

function stopSpeech() {
  speechSynthesis.cancel();
  speechQueue = [];
  isSpeaking = false;
  shouldStopSpeaking = true;
}

// Functions
function initGame() {
  // Stop any ongoing speech when starting a new game
  stopSpeech();
  
  const { numbers, solutions } = generator.generate();
  currentSolutions = solutions;

  renderCards(numbers);
  resetSolutions();
  updateMascot("新的题目来了！加油！");
  
  // Speak the numbers after a short delay to let the mascot message finish
  setTimeout(() => {
    speakNumbers(numbers);
  }, 1000);
}

function renderCards(numbers) {
  cardsContainer.innerHTML = '';

  numbers.forEach((num, index) => {
    const suit = getSuit();
    const displayNum = formatNumber(num);
    const colorClass = isRed(suit) ? 'red' : 'black';

    const cardEl = document.createElement('div');
    cardEl.className = `card ${colorClass}`;

    // Animation delay
    cardEl.style.animation = `bounce 0.5s ease ${index * 0.1}s`;

    cardEl.innerHTML = `
      <div class="suit top-left">${suit}</div>
      <div class="number">${displayNum}</div>
      <div class="suit bottom-right">${suit}</div>
    `;

    cardsContainer.appendChild(cardEl);
  });
}

function resetSolutions() {
  isSolutionsVisible = false;
  solutionsPanel.classList.remove('visible');
  solutionsPanel.classList.add('hidden'); // Initially hidden entirely via class toggling logic if needed. 
  // CSS handles visibility with max-height and opacity on .visible.
  // We should make sure content is cleared or updated.
  solutionsList.innerHTML = '';
  solutionCountSpan.textContent = currentSolutions.length;
  
  // Enable solve button again
  solveBtn.disabled = false;
  solveBtn.classList.remove('disabled');
}

function showSolutions() {
  if (isSolutionsVisible) return;

  // Disable solve button to prevent duplicate clicks
  solveBtn.disabled = true;
  solveBtn.classList.add('disabled');

  // Randomize solutions order to discourage pattern memorization
  // (though solver usually produces deterministic output order, users act differently)
  const shuffledSolutions = [...currentSolutions].sort(() => Math.random() - 0.5);

  solutionsList.innerHTML = shuffledSolutions
    .map(sol => `<li>${sol} = 24</li>`)
    .join('');

  solutionsPanel.classList.remove('hidden');
  // Trigger reflow to ensure transition works if going from display:none
  void solutionsPanel.offsetWidth;
  solutionsPanel.classList.add('visible');

  isSolutionsVisible = true;
  updateMascot("这里是所有的解法，记住思路比答案更重要哦！");

  // Speak solutions
  const speakSolutions = async () => {
    // Clear any existing speech and reset flag
    stopSpeech();
    shouldStopSpeaking = false;
    
    // Speak each solution
    for (const sol of shuffledSolutions) {
      if (shouldStopSpeaking) break;
      await speak(`${sol}等于24`);
      if (shouldStopSpeaking) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (shouldStopSpeaking) return;
    
    // Pause for 1 second before speaking the tip
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (shouldStopSpeaking) return;
    
    // Speak the anti-rote tip from the page
    await speak(antiRoteTip.textContent);
  };
  
  speakSolutions();
}

function updateMascot(text) {
  mascotMessage.textContent = text;
  // Re-trigger animation
  const mascot = document.querySelector('.mascot');
  mascot.style.animation = 'none';
  void mascot.offsetWidth;
  mascot.style.animation = 'bounce 2s infinite';
}

function randomMascotMessage() {
  if (!isSolutionsVisible) {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    updateMascot(msg);
  }
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
  initGame();
  randomMascotMessage();
});

solveBtn.addEventListener('click', () => {
  if (isSolutionsVisible) {
    updateMascot("已经在显示答案啦！");
    return;
  }
  showSolutions();
});

// Periodic encouragement (every 30s)
setInterval(() => {
  if (!isSolutionsVisible) {
    randomMascotMessage();
  }
}, 30000);

// Start
initGame();
