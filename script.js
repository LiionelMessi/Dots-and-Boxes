const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const boardWrap = document.getElementById('boardWrap');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const p1Card = document.getElementById('p1-card');
const p2Card = document.getElementById('p2-card');
const p2Name = document.getElementById('p2-name');
const resultDiv = document.getElementById('result');
const resultText = document.getElementById('resultText');
const gameModeSel = document.getElementById('gameMode');

// Cấu hình game
let rows = 3, cols = 3; 
let hLines = [], vLines = [], boxes = [];
let score = [0,0];
let current = 0; // 0: Player, 1: Player2/AI
let isVsAI = false;
let isGameActive = false;

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
  // Lấy dữ liệu input
  let inputRows = parseInt(document.getElementById('rows').value, 10) || 3;
  let inputCols = parseInt(document.getElementById('cols').value, 10) || 3;
  
  // Giới hạn
  inputRows = Math.min(11, Math.max(1, inputRows));
  inputCols = Math.min(11, Math.max(1, inputCols));
  
  document.getElementById('rows').value = inputRows;
  document.getElementById('cols').value = inputCols;

  rows = inputRows + 1; // dots
  cols = inputCols + 1; // dots

  // Chế độ chơi
  isVsAI = gameModeSel.value === 'pvc';
  p2Name.textContent = isVsAI ? "Máy (O)" : "Người 2 (O)";

  // Reset biến
  score = [0,0];
  current = 0;
  isGameActive = true;
  hLines = Array.from({length: rows}, () => Array(cols-1).fill(false));
  vLines = Array.from({length: rows-1}, () => Array(cols).fill(false));
  boxes = Array.from({length: rows-1}, () => Array(cols-1).fill(null));

  updateUI();
  buildBoard(rows, cols);
  resultDiv.classList.add('hidden');
}

function updateUI(){
  score1El.textContent = score[0];
  score2El.textContent = score[1];
  
  // Highlight lượt chơi
  p1Card.classList.toggle('active', current === 0);
  p2Card.classList.toggle('active', current === 1);
}

function buildBoard(r, c){
  boardWrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'board';

  // Grid Templates
  let colTemplate = [];
  for(let j=0; j < 2*c - 1; j++) colTemplate.push(j%2===0 ? 'var(--dot-dia)' : 'var(--box-size)');
  grid.style.gridTemplateColumns = colTemplate.join(' ');

  let rowTemplate = [];
  for(let i=0; i < 2*r - 1; i++) rowTemplate.push(i%2===0 ? 'var(--dot-dia)' : 'var(--box-size)');
  grid.style.gridTemplateRows = rowTemplate.join(' ');

  // Generate Cells
  for(let i=0;i<2*r-1;i++){
    for(let j=0;j<2*c-1;j++){
      const cell = document.createElement('div');
      
      if(i%2===0 && j%2===0) {
        cell.className = 'dot';
      } else if(i%2===0 && j%2===1) {
        // H-Line
        const hi = i/2, hj = (j-1)/2;
        cell.className = 'h-line';
        cell.id = `h-${hi}-${hj}`;
        cell.dataset.type = 'h';
        cell.dataset.r = hi; cell.dataset.c = hj;
        cell.addEventListener('click', onLineClick);
      } else if(i%2===1 && j%2===0) {
        // V-Line
        const vi = (i-1)/2, vj = j/2;
        cell.className = 'v-line';
        cell.id = `v-${vi}-${vj}`;
        cell.dataset.type = 'v';
        cell.dataset.r = vi; cell.dataset.c = vj;
        cell.addEventListener('click', onLineClick);
      } else {
        // Box
        cell.className = 'box';
        cell.id = `b-${(i-1)/2}-${(j-1)/2}`;
        cell.dataset.r = (i-1)/2;
        cell.dataset.c = (j-1)/2;
      }
      grid.appendChild(cell);
    }
  }
  boardWrap.appendChild(grid);
}

function onLineClick(e){
  if(!isGameActive) return;
  // Nếu đang là lượt máy thì người không được click
  if(isVsAI && current === 1) return;

  const type = e.currentTarget.dataset.type;
  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);

  processMove(type, r, c);
}

function processMove(type, r, c) {
  let valid = false;
  if(type === 'h' && !hLines[r][c]) {
    hLines[r][c] = true;
    valid = true;
    document.getElementById(`h-${r}-${c}`).classList.add('taken');
  } else if(type === 'v' && !vLines[r][c]) {
    vLines[r][c] = true;
    valid = true;
    document.getElementById(`v-${r}-${c}`).classList.add('taken');
  }

  if(!valid) return; // Đã click rồi thì thôi

  // Kiểm tra điểm
  let scored = 0;
  if(type === 'h') {
    if(r>0 && checkBox(r-1,c)) { boxes[r-1][c] = current; scored++; }
    if(r < rows-1 && checkBox(r,c)) { boxes[r][c] = current; scored++; }
  } else {
    if(c>0 && checkBox(r,c-1)) { boxes[r][c-1] = current; scored++; }
    if(c < cols-1 && checkBox(r,c)) { boxes[r][c] = current; scored++; }
  }

  if(scored > 0) {
    score[current] += scored;
    updateBoxVisuals();
    updateUI();
    checkEnd();
    // Nếu ăn điểm, giữ nguyên lượt.
    // Nếu là máy ăn điểm -> máy đi tiếp (gọi lại AI)
    if(isVsAI && current === 1 && isGameActive) {
       setTimeout(computerMove, 600);
    }
  } else {
    // Đổi lượt
    current = 1 - current;
    updateUI();
    
    // Nếu chế độ AI và đến lượt Máy
    if(isVsAI && current === 1 && isGameActive) {
      setTimeout(computerMove, 500);
    }
  }
}

function checkBox(r, c){
  if(r<0 || c<0 || r>=rows-1 || c>=cols-1) return false;
  return hLines[r][c] && hLines[r+1][c] && vLines[r][c] && vLines[r][c+1];
}

function updateBoxVisuals(){
  for(let i=0; i<rows-1; i++){
    for(let j=0; j<cols-1; j++){
      const val = boxes[i][j];
      const el = document.getElementById(`b-${i}-${j}`);
      if(val === 0) el.classList.add('player1');
      if(val === 1) el.classList.add('player2');
    }
  }
}

function checkEnd(){
  if(score[0] + score[1] === (rows-1)*(cols-1)) {
    isGameActive = false;
    resultDiv.classList.remove('hidden');
    if(score[0] > score[1]) resultText.textContent = "NGƯỜI 1 CHIẾN THẮNG!";
    else if(score[1] > score[0]) resultText.textContent = isVsAI ? "MÁY ĐÃ THẮNG!" : "NGƯỜI 2 CHIẾN THẮNG!";
    else resultText.textContent = "HÒA NHAU!";
  }
}

// --- LOGIC AI (BOT) ---
function computerMove() {
  if(!isGameActive) return;

  // 1. Tìm nước đi ăn điểm ngay (Greedy)
  // Duyệt qua tất cả các ô, xem ô nào đã có 3 cạnh -> đi cạnh thứ 4
  let move = findClosingMove();
  
  // 2. Nếu không có nước ăn điểm, chọn ngẫu nhiên
  if(!move) {
    move = pickRandomMove();
  }

  if(move) {
    processMove(move.type, move.r, move.c);
  }
}

function findClosingMove() {
  // Kiểm tra từng ô
  for(let r=0; r<rows-1; r++){
    for(let c=0; c<cols-1; c++){
      // Đếm số cạnh đã tô của ô này
      const top = hLines[r][c] ? 1 : 0;
      const bot = hLines[r+1][c] ? 1 : 0;
      const left = vLines[r][c] ? 1 : 0;
      const right = vLines[r][c+1] ? 1 : 0;
      
      if(top + bot + left + right === 3) {
        // Tìm cạnh còn thiếu
        if(!top) return {type:'h', r:r, c:c};
        if(!bot) return {type:'h', r:r+1, c:c};
        if(!left) return {type:'v', r:r, c:c};
        if(!right) return {type:'v', r:r, c:c+1};
      }
    }
  }
  return null;
}

function pickRandomMove() {
  let available = [];
  // Gom tất cả cạnh ngang chưa đi
  for(let r=0; r<rows; r++){
    for(let c=0; c<cols-1; c++){
      if(!hLines[r][c]) available.push({type:'h', r:r, c:c});
    }
  }
  // Gom tất cả cạnh dọc chưa đi
  for(let r=0; r<rows-1; r++){
    for(let c=0; c<cols; c++){
      if(!vLines[r][c]) available.push({type:'v', r:r, c:c});
    }
  }
  
  if(available.length === 0) return null;
  // Chọn random
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

// Start game mặc định
startGame();