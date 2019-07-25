//The following below deals with model
const TILE_SIZE = 50;
const TILE_COUNT = 9;
let grid = [];
let lastTilePlayed = [0, 0]; //to speed up solving
let generated = false; //used for determining if a user is inputting a hint or not (i.e. they want to solve or are solving a generated)
function Tile(value, fixed) {
  this.value = value;
  this.fixed = fixed; 
}
function setUpGrid() {
  generated = false;
  for (let i = 0; i < TILE_COUNT; i++) {
    grid.push([]);
    for (let j = 0; j < TILE_COUNT; j++) {
      grid[i].push(new Tile(0, false)); //faster to use tiles of value 0 than to use null and reinstantiate
    }
  }
  draw();
}
function clearSudoku(fullClear) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid.length; j++) {
      if (fullClear) grid[i][j].value = 0;
      else if (!grid[i][j].fixed) grid[i][j].value = 0 ;
    }
  }
}
function solveSudoku() {
  clearSudoku(false);
  _solveSudoku();
}
function _solveSudoku() { //uses backtracking
  let i = lastTilePlayed[0]; let j = lastTilePlayed[1]; //don't have to loop to the beginning
  for (i; i < TILE_COUNT; i++) {
    for (j; j < TILE_COUNT; j++) {
      if (grid[i][j].value === 0) break;
    }
    if (j === TILE_COUNT && i === TILE_COUNT - 1) { //no more blank tiles
      lastTilePlayed = [0, 0]; 
      return true;
    } else if (j === TILE_COUNT) {
      j = 0;
      continue;
    }
    if (grid[i][j].value === 0) break;
  }
  let vals = [1,2,3,4,5,6,7,8,9];
  let randVals = []; //used for generation
  for (let j = vals.length; j > 0; j--) { 
    let pos = Math.floor(Math.random() * j);
    randVals.push(vals[pos]);
    vals[pos] = vals[j - 1]; //shift down without shifting
  }
  while (randVals.length !== 0) {
    grid[i][j].value = randVals.pop();
    lastTilePlayed = [i, j];
    if (!checkConflict()) {
      if (_solveSudoku()) return true;
    }
  }
  //no value results in no conflict-- backtrack
  grid[i][j].value = 0; 
  return false;
}
function checkConflict() {
  let rows = [];let cols = []; let sect = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    rows.push([]); cols.push([]); sect.push([]);
  }
  //rows check
  for (let i = 0; i < TILE_COUNT; i++) {
    for (let j = 0; j < TILE_COUNT; j++) {
      if (grid[i][j].value !== 0) {
        if (rows[i].includes(grid[i][j].value)) return true;
        rows[i].push(grid[i][j].value);
      }
    }
  }
  //cols check
  for (let j = 0; j < TILE_COUNT; j++) {
    for (let i = 0; i < TILE_COUNT; i++) {
      if (grid[i][j].value !== 0) {
        if (cols[j].includes(grid[i][j].value)) return true;
        cols[j].push(grid[i][j].value);
      }
    }
  }
  //sect check
  for (let k = 0; k < TILE_COUNT; k++) {
    for (let i = 0; i < TILE_COUNT / 3; i++) {
      for (let j = 0; j < TILE_COUNT / 3; j++) { //I use 3 instead of TILE_COUNT / 3 because it looks *much* cleaner and TILE_COUNT will never change. Sue me for bad code practice I guess
        if (grid[3*Math.floor((k / 3)) + i][3*(k % 3) + j].value !== 0) { // k / 3 and k % 3 shifts along the 3x3 grid of big blocks
          if (sect[k].includes(grid[3*Math.floor((k / 3)) + i][3*(k % 3) + j].value)) return true;
          sect[k].push(grid[3*Math.floor((k / 3)) + i][3*(k % 3) + j].value);
        }
      }
    }
  }
  return false;
}
function generateSudoku() {
  generated = true;
  clearSudoku(true);
  _solveSudoku(); //fills with a valid sudoku board
  let stop = false;
  let freePositions = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    freePositions.push([])
    freePositions[i].push(i); //row labeling
    for (let j = 0; j < TILE_COUNT; j++) {
      freePositions[i].push(j); //col labeling
    }
  }
  let oldOldBoard = null; //used to be sure we have no duplicate solutions.
  let oldSolvedGrid = deepCopy(grid);
  let difficulty = +prompt("What difficulty would you like (1-15)?", "1");
  if (isNaN(difficulty) || difficulty < 1) difficulty = 1;
  else if (difficulty > 13) difficulty = 13; //don't question it...
  const MAX_ATTEMPTS = difficulty;
  const DUP_CHECK = 5; // How many times we solve a board before determining no duplicates possible (note: the chance of this happening is near 0)
  let d1 = new Date();
  while (!stop) { 
    //chooses random position
    let timesToTry = 0;
    let oldGrid = deepCopy(grid); //grid before we solved it
    for (timesToTry; timesToTry < MAX_ATTEMPTS; timesToTry++) { //how many times we should pick a random tile to see if we can remove it whilst still having 1 solution
      if ((new Date()).getTime() - d1.getTime() > 27000) { //so we don't take too long (30 seconds is when chrome complains)
        stop = true;
        grid = deepCopy(oldOldBoard);
        break;
      }
      let iPos = Math.floor(Math.random() * freePositions.length);
      let i = freePositions[iPos][0];
      let jPos = Math.floor((Math.random() * (freePositions[iPos].length - 1)) + 1);
      let j = freePositions[iPos][jPos];
      
      grid[i][j].value = 0;
      let k = 0;
      for (k; k < DUP_CHECK; k++) { //checks the number of solutions.
        _solveSudoku();
        if (!checkGridEquality(oldSolvedGrid)) break;
        grid = deepCopy(oldGrid); //resets so we can solve
        grid[i][j].value = 0;
      }
      if (k !== DUP_CHECK) grid = deepCopy(oldGrid);
      else {
        freePositions[iPos][jPos] = freePositions[iPos][freePositions[iPos].length - 1]; //swaps into last place and removes it
        freePositions[iPos].pop();
        if (freePositions[iPos].length === 1) freePositions.splice(iPos, 1); //no more col elements
        break;
      }
    }
    if (timesToTry === MAX_ATTEMPTS) {
      stop = true;
      grid = deepCopy(oldOldBoard);
    } else oldOldBoard = oldGrid;
  }
  for (let row of grid) {
    for (let entry of row) {
      if (entry) entry.fixed = true; //so they appear as clues
    }
  }
  draw();
}
function deepCopy(grid) {
  let oldGrid = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    oldGrid.push([]);
    for (let j = 0; j < TILE_COUNT; j++) {
      oldGrid[i].push(new Tile(grid[i][j].value, grid[i][j].fixed));
    }
  }
  return oldGrid;
}
function checkGridEquality(oldGrid) {
  for (let i = 0; i < TILE_COUNT; i++) {
    for (let j = 0; j < TILE_COUNT; j++) {
      if (grid[i][j].value !== oldGrid[i][j].value || grid[i][j].fixed !== oldGrid[i][j].fixed) return false;
    }
  }
  return true;
}
//The following below deals with view
let canvas = document.getElementById("main");
let ctx = canvas.getContext("2d");
let fontSize = 20;
function draw() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "lightGray";
  ctx.fillStyle = "lightGray";
  ctx.font = `${fontSize}px Lucida Console`
  ctx.lineWidth = 4;
  for (let i = 0; i < TILE_COUNT; i++) { //draws mini squares and fills in squares
    for (let j = 0; j < TILE_COUNT; j++) {
      ctx.beginPath();
      ctx.rect(ctx.lineWidth + (TILE_SIZE) * j, ctx.lineWidth + (TILE_SIZE) * i, TILE_SIZE, TILE_SIZE);
      if (grid[i][j].value !== 0) {
        ctx.fillStyle = (grid[i][j].fixed) ? "black" : "gray";
        ctx.fillText(grid[i][j].value, ctx.lineWidth + (TILE_SIZE) * j + TILE_SIZE * 0.5 - fontSize * .25, ctx.lineWidth + (TILE_SIZE) * i + TILE_SIZE * 0.5 + fontSize * .25);
      }
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "black";
  for (let i = 0; i < TILE_COUNT / 3; i++) { //draws big squares
    for (let j = 0; j < TILE_COUNT / 3; j++) {
      ctx.beginPath();
      ctx.rect(ctx.lineWidth + (TILE_SIZE) * 3 * j, ctx.lineWidth + (TILE_SIZE) * 3 * i, (TILE_SIZE) * 3, (TILE_SIZE) * 3);
      ctx.stroke();
    }
  }
}
function drawSquareBlue(i, j) {
  ctx.save();
  ctx.fillStyle = "LightSkyBlue";
  ctx.beginPath();
  ctx.fillRect(1.5 * ctx.lineWidth + (TILE_SIZE) * j, 1.5 * ctx.lineWidth + (TILE_SIZE) * i, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
  ctx.restore();
}
//The following below deals with controller
let selectedTile = [-1,-1];
canvas.addEventListener("click", function(event) {
  let mouseX = event.clientX - parseInt(canvas.getBoundingClientRect().left);
  let mouseY = event.clientY - parseInt(canvas.getBoundingClientRect().top);
  let i = Math.floor((mouseY - ctx.lineWidth) / TILE_SIZE); //inverse of how we determine pixel via position in array above ^
  let j = Math.floor((mouseX - ctx.lineWidth) / TILE_SIZE);
  selectedTile = (0 <= i && i < TILE_COUNT && 0 <= j && j < TILE_COUNT) ? [i,j] : [-1, -1];
  if (selectedTile[0] !== -1 && selectedTile[1] != -1) {
    draw();
    drawSquareBlue(selectedTile[0], selectedTile[1]);
  }
});
canvas.addEventListener("keydown", function(event) {
  if (selectedTile[0] !== -1 && selectedTile[1] !== -1) {
    if (event.key === "Backspace") {
      grid[selectedTile[0]][selectedTile[1]] = new Tile(0, !generated);
      draw();
    } else if (0 < +event.key && +event.key <= 9) {
      grid[selectedTile[0]][selectedTile[1]] = new Tile(+event.key, !generated);
      selectedTile = [-1, -1];
      draw();
    }
  }
});
canvas.addEventListener("keydown", event => {
  if (event.key !== "s") return;
  solveSudoku();
  draw();
});
canvas.addEventListener("keydown", event => {
  if (event.key !== "c") return;
  clearSudoku(true);
  draw();
});
canvas.addEventListener("keydown", event => {
  if (event.key !== "g") return;
  generateSudoku();
});
setUpGrid();
