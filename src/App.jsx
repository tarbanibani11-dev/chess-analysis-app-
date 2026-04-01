import { useState, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import AnalysisPanel from './components/AnalysisPanel'
import EvaluationGraph from './components/EvaluationGraph'
import useStockfish from './hooks/useStockfish'

function App() {
  const [game, setGame] = useState(new Chess())
  const [fen, setFen] = useState('start')
  const [history, setHistory] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  
  const { 
    evaluation, 
    bestLine, 
    isAnalyzing, 
    startAnalysis, 
    stopAnalysis 
  } = useStockfish()

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    try {
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
      
      startAnalysis(game.fen())
      return true
    } catch (e) {
      return false
    }
  }, [game, history, currentMove, startAnalysis])

  const goToMove = (index) => {
    const newGame = new Chess()
    for (let i = 0; i <= index; i++) {
      newGame.move(history[i])
    }
    setGame(newGame)
    setFen(newGame.fen())
    setCurrentMove(index)
    startAnalysis(newGame.fen())
  }

  const resetBoard = () => {
    const newGame = new Chess()
    setGame(newGame)
    setFen('start')
    setHistory([])
    setCurrentMove(-1)
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

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          Chess Analysis
        </h1>
        
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
            />
            
            <EvaluationGraph 
              history={history}
              currentMove={currentMove}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
            
