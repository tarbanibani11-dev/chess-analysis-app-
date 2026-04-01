import { Chess } from 'chess.js'

// Parse PGN string to game object
export const parsePGN = (pgnText) => {
  const lines = pgnText.split('\n')
  const headers = {}
  const moves = []
  
  let inMoves = false
  let moveText = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Parse headers
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const match = trimmed.match(/\[(\w+)\s+"([^"]*)"\]/)
      if (match) {
        headers[match[1]] = match[2]
      }
      continue
    }
    
    // Collect move text
    if (trimmed && !trimmed.startsWith('%')) {
      moveText += ' ' + trimmed
      inMoves = true
    }
  }
  
  // Parse moves
  if (moveText) {
    // Remove comments { ... } and variations ( ... )
    let clean = moveText
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\$\d+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Remove result markers
    clean = clean.replace(/(1-0|0-1|1\/2-1\/2|\*)$/, '').trim()
    
    // Split into tokens
    const tokens = clean.split(/\s+/)
    
    const game = new Chess()
    
    for (const token of tokens) {
      // Skip move numbers
      if (/^\d+\.$/.test(token)) continue
      
      // Try to make move
      try {
        const move = game.move(token, { sloppy: true })
        if (move) {
          moves.push({
            ...move,
            fen: game.fen(),
            turn: game.turn() === 'w' ? 'black' : 'white' // turn after move
          })
        }
      } catch (e) {
        // Invalid move, skip
      }
    }
  }
  
  return {
    headers,
    moves,
    result: headers.Result || '*',
    white: headers.White || 'Unknown',
    black: headers.Black || 'Unknown',
    date: headers.Date || '',
    event: headers.Event || '',
    site: headers.Site || ''
  }
}

// Generate PGN from moves
export const generatePGN = (headers, moves) => {
  let pgn = ''
  
  // Write headers
  for (const [key, value] of Object.entries(headers)) {
    pgn += `[${key} "${value}"]\n`
  }
  pgn += '\n'
  
  // Write moves
  const game = new Chess()
  let moveNum = 1
  
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      pgn += `${moveNum}. `
    }
    
    const move = game.move(moves[i])
    pgn += `${move.san} `
    
    if (i % 2 === 1) moveNum++
  }
  
  // Add result
  pgn += headers.Result || '*'
  
  return pgn
}

// Parse time control from PGN header
export const parseTimeControl = (tc) => {
  if (!tc) return null
  
  // Format: "300+3" or "40/9000:300+30"
  if (tc.includes('/')) {
    // Multiple time controls
    const parts = tc.split(':')
    return { type: 'multiple', value: tc }
  }
  
  const [seconds, increment] = tc.split('+').map(Number)
  return {
    type: 'simple',
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
    increment: increment || 0
  }
}

// Get game duration from PGN (if clock times available)
export const getGameDuration = (pgnText) => {
  const clockRegex = /\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/g
  const times = []
  
  let match
  while ((match = clockRegex.exec(pgnText)) !== null) {
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    const seconds = parseFloat(match[3])
    times.push(hours * 3600 + minutes * 60 + seconds)
  }
  
  if (times.length < 2) return null
  
  const start = times[0]
  const end = times[times.length - 1]
  
  return {
    startTime: start,
    endTime: end,
    duration: start - end,
    formatted: formatDuration(start - end)
  }
}

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Export games to PGN file
export const downloadPGN = (pgnText, filename = 'game.pgn') => {
  const blob = new Blob([pgnText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Validate PGN format
export const isValidPGN = (pgnText) => {
  if (!pgnText || typeof pgnText !== 'string') return false
  
  // Check for required headers
  const hasEvent = pgnText.includes('[Event "')
  const hasMoves = pgnText.match(/\d+\.\s*\w+/)
  
  return hasEvent || hasMoves
}
