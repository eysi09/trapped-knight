/**
 * A script that draws the journey of the Trapped Knight on an HTML5 canvas.
 * See this Numberphile video for reference: https://www.youtube.com/watch?v=RGQe8waGJ4w&
 */

type Direction = "up" | "left" | "down" | "right"
type VisitedSquares = { [key: number]: boolean }
type Board = number[][]
type Coords = number[]

// Just make sure it's big enough. Would be better to dynamically generate the board and stop when the knight is trapped
const BOARD_SIZE = 100

const colorSets = {
  basic: ["red", "orange", "yellow", "green", "blue", "purple"],
  vw: ["ffcfea", "feffbe", "cbffe6", "afe9ff", "bfb9ff"].map(c => `#${c}`),
  vwWhite: ["fff", "feffbe", "cbffe6", "afe9ff", "bfb9ff"].map(c => `#${c}`),
  vw2: ["ff6adf", "c774e8", "ad8cff", "87958e", "94d0ff"].map(c => `#${c}`),
  vw3: ["34e1fb", "63bcfb", "8dbafb", "fb93fc", "b9a1fb"].map(c => `#${c}`),
}

/**
 * Get coordinates of next square from based on direction when populating the board
 */
function getNextBoardSquare(x: number, y: number, direction: Direction) {
  switch (direction) {
    case "up":
      x -= 1
      break;
    case "left":
      y -= 1
      break;
    case "down":
      x += 1
      break;
    case "right":
      y += 1
      break;
  }
  return [x, y]
}

/**
 * All moves a knight is allowed the make
 */
function legalMoves(x: number, y: number): Coords[] {
  return [
    [x + 2, y + 1],
    [x + 1, y + 2],
    [x - 1, y + 2],
    [x - 2, y + 1],
    [x - 2, y - 1],
    [x - 1, y - 2],
    [x + 1, y - 2],
    [x + 2, y - 1],
  ]
}

function makeBoard() {
  let board: Board = []
  // create an empty board
  for (let x = 0; x <= BOARD_SIZE; x++) {
    board[x] = []
    for (let y = 0; y <= BOARD_SIZE; y++) {
      board[x][y] = 0
    }
  }

  // populate it, starting in the center
  const directions: Direction[] = ["right", "up", "left", "down"]
  let count = 2
  let x = BOARD_SIZE / 2
  let y = BOARD_SIZE / 2
  let moves = 0

  // initial value
  board[x][y] = 1

  // fill in the squares until we reach the edge of the board
  while (x > 0 && x < BOARD_SIZE) {
    const direction = directions[moves % 4]
    // number of steps to travel in the given direction
    const steps = Math.round((moves + 1) / 2)

    for (let s = 1; s <= steps; s++) {
      [x, y] = getNextBoardSquare(x, y, direction)
      board[x][y] = count
      count += 1
    }

    moves += 1
  }

  // Remove undefined
  // board = board.map(row => row.filter(Boolean))
  return board
}

function getNextLocation(x: number, y: number, board: Board, visitedSquares: VisitedSquares): Coords | null {
  const [nextLocation] = legalMoves(x, y)
    .map(([x, y]) => {
      return { x, y, val: board[x][y] }
    })
    .sort((a, b) => (a.val > b.val) ? 1 : ((b.val > a.val) ? -1 : 0))
    .filter(({ val }) => !visitedSquares[val])
  if (!nextLocation) {
    return null
  }
  return [nextLocation.x, nextLocation.y]
}

/**
 * Returns the path the knight walks until it gets trapped
 */
function walk(board: Board) {
  // knights starts in 1
  const visitedSquares: VisitedSquares = { 1: true }

  let x = BOARD_SIZE / 2
  let y = BOARD_SIZE / 2
  let path: [number, number][] = []
  let trapped = false

  while (!trapped) {
    const nextLocation = getNextLocation(x, y, board, visitedSquares)
    if (!nextLocation) {
      console.log("No more moves, final value is", board[x][y])
      trapped = true
      break
    }
    x = nextLocation[0]
    y = nextLocation[1]
    const val = board[x][y]
    path.push([x, y])
    visitedSquares[val] = true
  }

  return path
}

function draw() {
  // setup canvas
  const scale = 50
  const canvas = <HTMLCanvasElement>document.createElement("canvas")
  canvas.height = BOARD_SIZE * scale
  canvas.width = BOARD_SIZE * scale
  const wrap = document.getElementById("board")!
  wrap.appendChild(canvas)

  // initialise the "chess" board and walk it
  const board = makeBoard()
  const path = walk(board)

  // setup canvas context
  const colors = colorSets.vw
  const movesPerColor = Math.floor(path.length / colors.length)
  const ctx = <CanvasRenderingContext2D>canvas.getContext("2d")

  ctx.lineWidth = 8
  // set background color
  ctx.fillStyle = "transparent"
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // init background image
  const background = new Image()
  background.src = "https://cdn140.picsart.com/267635931016211.png?r1024x1024"
  background.crossOrigin = "anonymous"

  // TODO Translate to match numberphile image
  // ctx.translate(0, canvas.height);
  // ctx.scale(1, -1);

  // Draw the path. Note that we have to begin and close the path on each iteration so that we
  // can change the strokeStyle color.
  const drawPath = () => {
    path.forEach(([x, y], idx) => {
      if (idx >= path.length - 1) {
        return
      }

      const colorIdx = Math.floor(idx / movesPerColor) % colors.length
      ctx.strokeStyle = colors[colorIdx]

      const [nextX, nextY] = path[idx + 1]
      ctx.beginPath()
      ctx.moveTo(x * scale, y * scale)
      ctx.lineTo(nextX * scale, nextY * scale)
      ctx.stroke()
      ctx.closePath()
    })
  }

  // set background image
  const drawBgImage = () => {
    // for aligning horse-y
    const padX = 165
    const padY = -95
    const x = (canvas.height / 2) - (background.height / 2) + padX
    const y = (canvas.width / 2) - (background.width / 2) + padY
    ctx.drawImage(background, x, y)
  }

  // add header text
  const drawText = () => {
    ctx.font = "430px Helvetica Neue";
    ctx.textAlign = "center";
    ctx.lineWidth = 10
    // this is a darkened version of colorSets.vw[0]
    ctx.strokeStyle = "#ffa0d5"
    ctx.strokeText("2 0 8 4", canvas.width / 2, 850);
  }

  // add background image, draw the path, and add the text
  background.onload = () => {
    drawPath()
    drawBgImage()
    drawText()
  }
}

draw()