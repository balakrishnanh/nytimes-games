export type GridCell = string | null // string is a letter, null is a black square
export const GRID_SIZE = 5

// Helper: Get all numbers for the grid
export function getGridNumbers(grid: GridCell[][]) {
  const numbers: Record<string, number> = {} 
  let currentNumber = 1

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) continue

      const isStartAcross = (c === 0 || grid[r][c - 1] === null) && (c + 1 < GRID_SIZE && grid[r][c + 1] !== null)
      const isStartDown = (r === 0 || grid[r - 1][c] === null) && (r + 1 < GRID_SIZE && grid[r + 1][c] !== null)

      if (isStartAcross || isStartDown) {
        numbers[`${r}-${c}`] = currentNumber++
      }
    }
  }
  return numbers
}

// Helper: Find which clue number a specific cell belongs to
export function getClueNumber(r: number, c: number, direction: 'across' | 'down', grid: GridCell[][], numbers: Record<string, number>) {
  if (grid[r][c] === null) return null

  let curr = direction === 'across' ? c : r
  
  // Walk backwards to find the start of the word
  while (curr > 0) {
    const prevVal = direction === 'across' ? grid[r][curr - 1] : grid[curr - 1][c]
    if (prevVal === null) break
    curr--
  }

  const startKey = direction === 'across' ? `${r}-${curr}` : `${curr}-${c}`
  return numbers[startKey]
}