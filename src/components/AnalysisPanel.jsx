import { useMemo } from 'react'

function AnalysisPanel({ evaluation, bestLine, isAnalyzing, history, currentMove, onMoveClick }) {
  const formatEval = (evalObj) => {
    if (!evalObj) return '0.0'
    
    if (evalObj.type === 'mate') {
      return `M${evalObj.value}`
    }
    
    const val = evalObj.value / 100
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
  }

  const getMoveClass = (san, index) => {
    // Simplified classification - in real app would compare with engine eval
    if (!bestLine || index !== currentMove) return ''
    
    // This is placeholder logic - real implementation needs deeper analysis
    return ''
  }

  const movesDisplay = useMemo(() => {
    const pairs = []
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: history[i]?.san || '',
        black: history[i + 1]?.san || ''
      })
    }
    return pairs
  }, [history])

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      {/* Evaluation Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Evaluation</span>
          <span className={`eval-score ${evaluation?.value > 0 ? 'text-white' : 'text-gray-300'}`}>
            {isAnalyzing ? 'Analyzing...' : formatEval(evaluation)}
          </span>
        </div>
        
        <div className="analysis-bar">
          <div 
            className="analysis-bar-white"
            style={{ 
              width: evaluation ? `${50 + (evaluation.value / 1000) * 50}%` : '50%' 
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 mix-blend-difference">
            {formatEval(evaluation)}
          </div>
        </div>
      </div>

      {/* Best Line */}
      {bestLine && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <span className="text-sm text-gray-400 block mb-1">Best continuation:</span>
          <span className="text-green-400 font-mono text-sm">
            {bestLine.slice(0, 5).join(' ')}
          </span>
        </div>
      )}

      {/* Move List */}
      <div className="max-h-64 overflow-y-auto">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Moves</h3>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
          {movesDisplay.map((pair, idx) => (
            <div key={idx} className="contents">
              <span className="text-gray-500 font-mono">{pair.number}.</span>
              <button
                onClick={() => onMoveClick(idx * 2)}
                className={`text-left hover:bg-gray-700 px-1 rounded ${
                  currentMove === idx * 2 ? 'bg-blue-600 text-white' : 'text-gray-300'
                } ${getMoveClass(pair.white, idx * 2)}`}
              >
                {pair.white}
              </button>
              <button
                onClick={() => pair.black && onMoveClick(idx * 2 + 1)}
                className={`text-left hover:bg-gray-700 px-1 rounded ${
                  currentMove === idx * 2 + 1 ? 'bg-blue-600 text-white' : 'text-gray-300'
                } ${getMoveClass(pair.black, idx * 2 + 1)}`}
              >
                {pair.black}
              </button>
            </div>
          ))}
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          Make a move to start analysis
        </p>
      )}
    </div>
  )
}

export default AnalysisPanel
