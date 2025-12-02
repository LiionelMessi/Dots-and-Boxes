const startBtn = document.getElementById('startBtn');
const boardWrap = document.getElementById('boardWrap');
const turnDiv = document.getElementById('turn');
const scoreDiv = document.getElementById('score');
const resultDiv = document.getElementById('result');

let rows = 3, cols = 3;
let hLines = [], vLines = [], boxes = [];
let score = [0,0];
let current = 0; // 0: player1, 1:player2

startBtn.addEventListener('click', () => {
  rows = Math.max(2, parseInt(document.getElementById('rows').value,10) || 3);
  cols = Math.max(2, parseInt(document.getElementById('cols').value,10) || 3);
  initGame();
});

function initGame(){
  score = [0,0];
  current = 0;
  updateStatus();
  buildBoard(rows, cols);
  resultDiv.classList.add('hidden');
}

function updateStatus(){
  turnDiv.textContent = `Lượt: ${current===0 ? 'Người 1 (X)' : 'Người 2 (O)'}`;
  scoreDiv.textContent = `Điểm — Người 1: ${score[0]} | Người 2: ${score[1]}`;
}

// --- HÀM QUAN TRỌNG ĐÃ ĐƯỢC SỬA ---
function buildBoard(r, c){
  boardWrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'board';

  // SỬA ĐỔI Ở ĐÂY: Tạo Grid Template xen kẽ kích thước
  // Chúng ta dùng biến CSS đã định nghĩa: var(--dot-dia) và var(--box-size)

  // 1. Tạo template cho CỘT (Columns)
  let colTemplate = [];
  for(let j=0; j < 2*c - 1; j++) {
      // Nếu j chẵn -> cột chứa chấm (nhỏ). Nếu j lẻ -> cột chứa đường ngang/hộp (to)
      colTemplate.push(j % 2 === 0 ? 'var(--dot-dia)' : 'var(--box-size)');
  }
  grid.style.gridTemplateColumns = colTemplate.join(' ');

  // 2. Tạo template cho HÀNG (Rows) - Bổ sung thêm phần này
  let rowTemplate = [];
  for(let i=0; i < 2*r - 1; i++) {
      // Nếu i chẵn -> hàng chứa chấm (nhỏ). Nếu i lẻ -> hàng chứa đường dọc/hộp (to)
      rowTemplate.push(i % 2 === 0 ? 'var(--dot-dia)' : 'var(--box-size)');
  }
  grid.style.gridTemplateRows = rowTemplate.join(' ');


  // reset data
  hLines = Array.from({length: r}, () => Array(c-1).fill(false));
  vLines = Array.from({length: r-1}, () => Array(c).fill(false));
  boxes = Array.from({length: r-1}, () => Array(c-1).fill(null));

  for(let i=0;i<2*r-1;i++){
    for(let j=0;j<2*c-1;j++){
      const cell = document.createElement('div');
      if(i%2===0 && j%2===0){
        // dot
        cell.className = 'dot';
      } else if(i%2===0 && j%2===1){
        // horizontal line
        const hi = i/2;
        const hj = (j-1)/2;
        cell.className = 'h-line';
        cell.dataset.r = hi;
        cell.dataset.c = hj;
        cell.addEventListener('click', onHLineClick);
      } else if(i%2===1 && j%2===0){
        // vertical line
        const vi = (i-1)/2;
        const vj = j/2;
        cell.className = 'v-line';
        cell.dataset.r = vi;
        cell.dataset.c = vj;
        cell.addEventListener('click', onVLineClick);
      } else {
        // box
        cell.className = 'box';
        cell.dataset.r = (i-1)/2;
        cell.dataset.c = (j-1)/2;
      }
      grid.appendChild(cell);
    }
  }
  boardWrap.appendChild(grid);
  updateVisuals();
}

// ... (Các hàm phía dưới: onHLineClick, onVLineClick, checkBox, handleMove, paintBoxes, updateVisuals, checkEnd giữ nguyên không đổi) ...
function onHLineClick(e){
  const r = parseInt(e.currentTarget.dataset.r,10);
  const c = parseInt(e.currentTarget.dataset.c,10);
  if(hLines[r][c]) return;
  hLines[r][c] = true;
  e.currentTarget.classList.add('taken');
  handleMove(() => {
    let scored = 0;
    if(r>0 && checkBox(r-1,c)){ boxes[r-1][c] = current; scored++; }
    if(r < hLines.length-1 && checkBox(r,c)){ boxes[r][c] = current; scored++; }
    return scored;
  });
}

function onVLineClick(e){
  const r = parseInt(e.currentTarget.dataset.r,10);
  const c = parseInt(e.currentTarget.dataset.c,10);
  if(vLines[r][c]) return;
  vLines[r][c] = true;
  e.currentTarget.classList.add('taken');
  handleMove(() => {
    let scored = 0;
    if(c>0 && checkBox(r,c-1)){ boxes[r][c-1] = current; scored++; }
    if(c < vLines[0].length-1 && checkBox(r,c)){ boxes[r][c] = current; scored++; }
    return scored;
  });
}

function checkBox(br, bc){
  if(br<0 || bc<0) return false;
  if(br >= hLines.length-1) return false;
  if(bc >= hLines[0].length) return false;
  const top = hLines[br][bc];
  const bottom = hLines[br+1][bc];
  const left = vLines[br][bc];
  const right = vLines[br][bc+1];
  return top && bottom && left && right;
}

function handleMove(scoreCheckFn){
  const gained = scoreCheckFn();
  if(gained>0){
    score[current] += gained;
    paintBoxes();
    updateStatus();
  } else {
    current = 1 - current;
    updateStatus();
  }
  paintBoxes();
  checkEnd();
}

function paintBoxes(){
  const boxesEls = document.querySelectorAll('.box');
  boxesEls.forEach(el => {
    const r = parseInt(el.dataset.r,10);
    const c = parseInt(el.dataset.c,10);
    const val = boxes[r] && boxes[r][c];
    el.classList.remove('player1','player2');
    if(val === 0) el.classList.add('player1');
    else if(val === 1) el.classList.add('player2');
  });
}

function updateVisuals(){
  document.querySelectorAll('.h-line').forEach(el => {
    const r = parseInt(el.dataset.r,10), c = parseInt(el.dataset.c,10);
    if(hLines[r][c]) el.classList.add('taken');
  });
  document.querySelectorAll('.v-line').forEach(el => {
    const r = parseInt(el.dataset.r,10), c = parseInt(el.dataset.c,10);
    if(vLines[r][c]) el.classList.add('taken');
  });
  paintBoxes();
  updateStatus();
}

function checkEnd(){
  const totalBoxes = (rows-1)*(cols-1);
  const claimed = score[0] + score[1];
  if(claimed === totalBoxes){
    resultDiv.classList.remove('hidden');
    if(score[0] > score[1]) resultDiv.textContent = `Kết thúc — Người 1 thắng ${score[0]} : ${score[1]}`;
    else if(score[1] > score[0]) resultDiv.textContent = `Kết thúc — Người 2 thắng ${score[1]} : ${score[0]}`;
    else resultDiv.textContent = `Hòa ${score[0]} : ${score[1]}`;
  }
}

initGame();