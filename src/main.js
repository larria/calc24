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

// State
let currentSolutions = [];
let isSolutionsVisible = false;

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

const MESSAGES = [
  "动动脑筋，在这个小脑袋里算一算！",
  "不要偷看答案，除非你真的试过了！",
  "算错了没关系，再试一次！",
  "你是最棒的数学小天才！",
  "想想看，有什么办法能凑成24？"
];

// Functions
function initGame() {
  const { numbers, solutions } = generator.generate();
  currentSolutions = solutions;

  renderCards(numbers);
  resetSolutions();
  updateMascot("新的题目来了！加油！");
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
}

function showSolutions() {
  if (isSolutionsVisible) return;

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
