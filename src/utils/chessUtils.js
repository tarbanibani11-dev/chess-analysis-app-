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

// Convert centipawns to win probability (simplified)
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

// Convert UCI move to SAN (Standard Algebraic Notation)
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

// Get opening name from FEN (simplified - real app would use ECO db)
export const getOpeningName = (fen) => {
  // Placeholder - real implementation needs ECO database
  const moves = fen.split(' ')[5] // halfmove clock not useful here
  return 'Unknown Opening'
}

// Calculate accuracy percentage from move classifications
export const calculateAccuracy = (moves, side) => {
  const sideMoves = moves.filter(m => 
    (side === 'white' && m.side === 'w') || 
    (side === 'black' && m.side === 'b')
  )
  
  if (sideMoves.length === 0) return 0
  
  const weights = {
    best: 1.0,
    excellent: 0.9,
    good: 0.7,
    inaccuracy: 0.5,
    mistake: 0.3,
    blunder: 0.0
  }
  
  const totalWeight = sideMoves.reduce((sum, m) => {
    return sum + (weights[m.classification?.class] || 0.5)
  }, 0)
  
  return Math.round((totalWeight / sideMoves.length) * 100)
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
