import { useState, useCallback, useEffect } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import AnalysisPanel from './components/AnalysisPanel'
import EvaluationGraph from './components/EvaluationGraph'
import ImportPanel from './components/ImportPanel'
import useStockfish from './hooks/useStockfish'
import useAnalysis from './hooks/useAnalysis'
import { classifyMove, getAccuracy } from './utils/chessUtils'

function App() {
  const [game, setGame] = useState(new Chess())
  const [fen, setFen] = useState('start')
  const [history, setHistory] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  const [moveClassifications, setMoveClassifications] = useState([])
  const [showImport, setShowImport] = useState(false)
  
  const { 
    evaluation, 
    bestLine, 
    isAnalyzing, 
    startAnalysis, 
    stopAnalysis,
    getBestMove 
  } = useStockfish()

  // Analyze position after each move
  useEffect(() => {
    if (fen !== 'start') {
      startAnalysis(fen)
    }
  }, [fen])

  const classifyLastMove = useCallback(async (prevFen, currentFen, move) => {
    if (!prevFen || currentMove < 0) return null
    
    // Get eval before move
    const prevEval = await new Promise(resolve => {
      const checkEval = setInterval(() => {
        if (evaluation && !isAnalyzing) {
          clearInterval(checkEval)
          resolve(evaluation)
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkEval)
        resolve(evaluation)
      }, 2000)
    })
    
    // Get eval after move
    startAnalysis(currentFen)
    await new Promise(r => setTimeout(r, 1500))
    
    const currentEval = evaluation
    
    return classifyMove(prevEval, currentEval, move.color)
  }, [evaluation, isAnalyzing, startAnalysis, currentMove])

  const onDrop = useCallback(async (sourceSquare, targetSquare) => {
    try {
      const prevFen = game.fen()
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })

      if (move === null) return false

      const newGame = new Chess(game.fen())
      setGame(newGame)
      setFen(game.fen())
      
      const newHistory = [...history.slice(0, currentMove + 1), move]
      setHistory(newHistory)
      setCurrentMove(newHistory.length - 1)
      
      // Classify move
      const classification = await classifyLastMove(prevFen, game.fen(), move)
      const newClassifications = [...moveClassifications.slice(0, currentMove + 1)]
      newClassifications.push(classification)
      setMoveClassifications(newClassifications)
      
      return true
    } catch (e) {
      return false
    }
  }, [game, history, currentMove, moveClassifications, classifyLastMove])

  const goToMove = (index) => {
    const newGame = new Chess()
    for (let i = 0; i <= index; i++) {
      newGame.move(history[i])
    }
    setGame(newGame)
    setFen(newGame.fen())
    setCurrentMove(index)
  }

  const loadGame = (pgnGame) => {
    const newGame = new Chess()
    
    // Apply all moves
    for (const move of pgnGame.moves) {
      newGame.move(move)
    }
    
    setGame(new Chess(newGame.fen()))
    setFen(newGame.fen())
    setHistory(pgnGame.moves)
    setCurrentMove(pgnGame.moves.length - 1)
    setMoveClassifications([])
    
    // Analyze all moves
    analyzeGame(pgnGame.moves)
  }

  const analyzeGame = async (moves) => {
    const classifications = []
    const tempGame = new Chess()
    
    for (let i = 0; i < moves.length; i++) {
      const prevFen = tempGame.fen()
      const move = moves[i]
      tempGame.move(move)
      
      // Quick analysis (shorter time for batch)
      startAnalysis(tempGame.fen())
      await new Promise(r => setTimeout(r, 800))
      
      const classification = classifyMove(
        { value: 0 }, // Simplified - should store actual evals
        evaluation || { value: 0 },
        move.color
      )
      
      classifications.push(classification)
    }
    
    setMoveClassifications(classifications)
  }

  const resetBoard = () => {
    const newGame = new Chess()
    setGame(newGame)
    setFen('start')
    setHistory([])
    setCurrentMove(-1)
    setMoveClassifications([])
    stopAnalysis()
  }

  const undoMove = () => {
    if (currentMove < 0) return
    goToMove(currentMove - 1)
  }

  const redoMove = () => {
    if (currentMove >= history.length - 1) return
    goToMove(currentMove + 1)
  }

  const accuracy = getAccuracy(moveClassifications)

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            ♟️ Chess Analysis
          </h1>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            {showImport ? 'Hide Import' : 'Import Chess.com'}
          </button>
        </div>

        {showImport && (
          <ImportPanel onLoadGame={loadGame} />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <Chessboard 
                position={fen}
                onPieceDrop={onDrop}
                boardWidth={600}
                customBoardStyle={{
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
              />
              
              {/* Controls */}
              <div className="flex justify-center gap-2 mt-4">
                <button 
                  onClick={undoMove}
                  disabled={currentMove < 0}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  ← Undo
                </button>
                <button 
                  onClick={resetBoard}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
                >
                  Reset
                </button>
                <button 
                  onClick={redoMove}
                  disabled={currentMove >= history.length - 1}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Redo →
                </button>
              </div>

              {/* Accuracy */}
              {accuracy.white > 0 && (
                <div className="flex justify-center gap-8 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">White Accuracy</div>
                    <div className="text-2xl font-bold text-white">{accuracy.white}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Black Accuracy</div>
                    <div className="text-2xl font-bold text-white">{accuracy.black}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-4">
            <AnalysisPanel 
              evaluation={evaluation}
              bestLine={bestLine}
              isAnalyzing={isAnalyzing}
              history={history}
              currentMove={currentMove}
              onMoveClick={goToMove}
              classifications={moveClassifications}
            />
            
            <EvaluationGraph 
              history={history}
              currentMove={currentMove}
              classifications={moveClassifications}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
        
            
