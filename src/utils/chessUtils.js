    import { Chess } from 'chess.js'

// Format evaluation to readable string
export const formatEval = (evalObj) => {
  if (!evalObj) return '0.00'
  
  if (evalObj.type === 'mate') {
    const mateIn = Math.abs(evalObj.value)
    return evalObj.value > 0 ? `+M${mateIn}` : `-M${mateIn}`
  }
  
  const pawns = evalObj.value / 100
  return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2)
}

// Convert centipawns to win probability
export const evalToWinChance = (cp) => {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

// Get color from FEN (who to move)
export const getSideToMove = (fen) => {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

// Check if game is over and get result
export const getGameResult = (game) => {
  if (!game.isGameOver()) return null
  
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'black' : 'white'
    return { type: 'checkmate', winner }
  }
  if (game.isDraw()) {
    if (game.isStalemate()) return { type: 'stalemate', winner: null }
    if (game.isThreefoldRepetition()) return { type: 'repetition', winner: null }
    if (game.isInsufficientMaterial()) return { type: 'insufficient', winner: null }
    return { type: 'draw', winner: null }
  }
  return null
}

// Classify move based on evaluation change
export const classifyMove = (evalBefore, evalAfter, side) => {
  // Default values
  const before = evalBefore?.value || 0
  const after = evalAfter?.value || 0
  
  // Calculate centipawn loss
  let loss = 0
  
  if (side === 'w') {
    // White moved: eval should stay same or improve
    loss = (before - after)
  } else {
    // Black moved: eval should stay same or improve for black
    loss = (after - before)
  }
  
  // Check for mate situations
  if (evalAfter?.type === 'mate') {
    const mateIn = Math.abs(evalAfter.value)
    if ((side === 'w' && evalAfter.value > 0) || (side === 'b' && evalAfter.value < 0)) {
      // Found mate
      return { class: 'brilliant', loss: 0 }
    }
  }
  
  // Classification thresholds (centipawns)
  if (loss < 10) {
    // Check if it was the only good move
    return { class: 'best', loss }
  } else if (loss < 30) {
    return { class: 'excellent', loss }
  } else if (loss < 70) {
    return { class: 'good', loss }
  } else if (loss < 150) {
    return { class: 'inaccuracy', loss }
  } else if (loss < 300) {
    return { class: 'mistake', loss }
  } else {
    return { class: 'blunder', loss }
  }
}

// Calculate accuracy percentage from classifications
export const getAccuracy = (classifications) => {
  if (!classifications || classifications.length === 0) {
    return { white: 0, black: 0 }
  }
  
  const whiteMoves = classifications.filter((_, i) => i % 2 === 0)
  const blackMoves = classifications.filter((_, i) => i % 2 === 1)
  
  const calcAccuracy = (moves) => {
    if (moves.length === 0) return 0
    
    // Weighted by centipawn loss
    const totalLoss = moves.reduce((sum, m) => sum + (m?.loss || 0), 0)
    const avgLoss = totalLoss / moves.length
    
    // Accuracy formula: 100 - (avgLoss / 10), min 0
    return Math.max(0, Math.min(100, Math.round(100 - (avgLoss / 10))))
  }
  
  return {
    white: calcAccuracy(whiteMoves),
    black: calcAccuracy(blackMoves)
  }
}

// Convert UCI move to SAN
export const uciToSan = (uci, fen) => {
  try {
    const game = new Chess(fen)
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.slice(4, 5) || undefined
    })
    return move ? move.san : uci
  } catch {
    return uci
  }
}

// Parse multiple UCI moves
export const parseVariation = (uciMoves, startFen) => {
  const game = new Chess(startFen)
  const sanMoves = []
  
  for (const uci of uciMoves) {
    try {
      const move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.slice(4, 5) || undefined
      })
      if (move) sanMoves.push(move.san)
    } catch {
      break
    }
  }
  
  return sanMoves
}

// Export FEN to clipboard
export const copyFEN = (fen) => {
  navigator.clipboard.writeText(fen)
}

// Get piece value for material count
export const getPieceValue = (piece) => {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  return values[piece.type] || 0
}

// Calculate material imbalance
export const getMaterialCount = (fen) => {
  const piecePlacement = fen.split(' ')[0]
  let white = 0, black = 0
  
  for (const char of piecePlacement) {
    if (char >= 'A' && char <= 'Z') {
      white += getPieceValue({ type: char.toLowerCase() })
    } else if (char >= 'a' && char <= 'z') {
      black += getPieceValue({ type: char })
    }
  }
  
  return { white, black, diff: white - black }
    }

