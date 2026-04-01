import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'

export function useAnalysis() {
  const [analysisData, setAnalysisData] = useState([])
  const [isAnalyzingGame, setIsAnalyzingGame] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  
  const abortRef = useRef(false)

  const classifyMove = (evalBefore, evalAfter, side) => {
    const diff = side === 'w' 
      ? (evalAfter - evalBefore) 
      : (evalBefore - evalAfter)
    
    const centipawnLoss = Math.max(0, diff)
    
    if (centipawnLoss > 300) return { class: 'blunder', label: '??', loss: centipawnLoss }
    if (centipawnLoss > 150) return { class: 'mistake', label: '?', loss: centipawnLoss }
    if (centipawnLoss > 50) return { class: 'inaccuracy', label: '?!', loss: centipawnLoss }
    if (centipawnLoss > 20) return { class: 'good', label: '', loss: centipawnLoss }
    return { class: 'best', label: '', loss: centipawnLoss }
  }

  const analyzeGame = useCallback(async (moves, getEvalFunction) => {
    abortRef.current = false
    setIsAnalyzingGame(true)
    setCurrentProgress(0)
    setAnalysisData([])
    
    const game = new Chess()
    const results = []
    
    for (let i = 0; i < moves.length; i++) {
      if (abortRef.current) break
      
      // Get eval before move
      const fenBefore = game.fen()
      const evalBefore = await getEvalFunction(fenBefore)
      
      // Make move
      game.move(moves[i])
      
      // Get eval after
      const fenAfter = game.fen()
      const evalAfter = await getEvalFunction(fenAfter)
      
      // Classify
      const side = i % 2 === 0 ? 'w' : 'b'
      const classification = classifyMove(
        evalBefore?.value || 0, 
        evalAfter?.value || 0, 
        side
      )
      
      results.push({
        moveNumber: Math.floor(i / 2) + 1,
        side,
        san: moves[i].san,
        fen: fenAfter,
        evalBefore,
        evalAfter,
        classification,
        bestMove: null // Would need engine suggestion
      })
      
      setAnalysisData([...results])
      setCurrentProgress(((i + 1) / moves.length) * 100)
    }
    
    setIsAnalyzingGame(false)
    return results
  }, [])

  const stopAnalysis = useCallback(() => {
    abortRef.current = true
    setIsAnalyzingGame(false)
  }, [])

  const getAccuracy = useCallback(() => {
    if (analysisData.length === 0) return { white: 0, black: 0 }
    
    const whiteMoves = analysisData.filter(d => d.side === 'w')
    const blackMoves = analysisData.filter(d => d.side === 'b')
    
    const calcAccuracy = (moves) => {
      if (moves.length === 0) return 0
      const totalLoss = moves.reduce((sum, m) => sum + m.classification.loss, 0)
      return Math.max(0, 100 - (totalLoss / moves.length / 10))
    }
    
    return {
      white: Math.round(calcAccuracy(whiteMoves)),
      black: Math.round(calcAccuracy(blackMoves))
    }
  }, [analysisData])

  return {
    analysisData,
    isAnalyzingGame,
    currentProgress,
    analyzeGame,
    stopAnalysis,
    getAccuracy
  }
}

export default useAnalysis
