import { useMemo } from 'react'

const CLASSIFICATION_STYLES = {
  brilliant: { color: '#1baca6', symbol: '!!', label: 'Brilliant' },
  great: { color: '#81b64c', symbol: '!', label: 'Great' },
  best: { color: '#81b64c', symbol: '', label: 'Best' },
  excellent: { color: '#81b64c', symbol: '', label: 'Excellent' },
  good: { color: '#a0a0a0', symbol: '', label: 'Good' },
  inaccuracy: { color: '#f0c14c', symbol: '?!', label: 'Inaccuracy' },
  mistake: { color: '#e58f2a', symbol: '?', label: 'Mistake' },
  blunder: { color: '#ca3431', symbol: '??', label: 'Blunder' },
  miss: { color: '#ca3431', symbol: '?!', label: 'Miss' },
  forced: { color: '#a0a0a0', symbol: '', label: 'Forced' }
}

function AnalysisPanel({ evaluation, bestLine, isAnalyzing, history, currentMove, onMoveClick, classifications }) {
  const formatEval = (evalObj) => {
    if (!evalObj) return '0.0'
    
    if (evalObj.type === 'mate') {
      const mateIn = Math.abs(evalObj.value)
      return evalObj.value > 0 ? `+M${mateIn}` : `-M${mateIn}`
    }
    
    const val = evalObj.value / 100
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
  }

  const getClassificationStyle = (idx) => {
    const cls = classifications[idx]
    if (!cls) return null
    return CLASSIFICATION_STYLES[cls.class] || null
  }

  const movesDisplay = useMemo(() => {
    const pairs = []
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: { move: history[i], idx: i },
        black: history[i + 1] ? { move: history[i + 1], idx: i + 1 } : null
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
          <span className={`eval-score font-mono font-bold ${
            (evaluation?.value || 0) > 0 ? 'text-white' : 'text-gray-300'
          }`}>
            {isAnalyzing ? 'Analyzing...' : formatEval(evaluation)}
          </span>
        </div>
        
        <div className="analysis-bar h-8 bg-gray-700 rounded overflow-hidden relative">
          <div 
            className="analysis-bar-white absolute left-0 top-0 h-full bg-white transition-all duration-300"
            style={{ 
              width: evaluation ? `${Math.min(100, Math.max(0, 50 + (evaluation.value / 1000) * 50))}%` : '50%' 
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 mix-blend-difference">
            {formatEval(evaluation)}
          </div>
        </div>
      </div>

      {/* Best Line */}
      {bestLine && bestLine.length > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <span className="text-sm text-gray-400 block mb-1">Best continuation:</span>
          <span className="text-green-400 font-mono text-sm">
            {bestLine.slice(0, 6).join(' ')}
          </span>
        </div>
      )}

      {/* Move List with Classifications */}
      <div className="max-h-80 overflow-y-auto">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Moves</h3>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {Object.entries(CLASSIFICATION_STYLES).slice(0, 6).map(([key, style]) => (
            <span key={key} className="flex items-center gap-1">
              <span style={{ color: style.color }}>{style.symbol || '●'}</span>
              <span className="text-gray-500">{style.label}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-sm">
          {movesDisplay.map((pair, idx) => (
            <div key={idx} className="contents">
              <span className="text-gray-500 font-mono py-1">{pair.number}.</span>
              
              {/* White move */}
              <button
                onClick={() => onMoveClick(pair.white.idx)}
                className={`text-left px-2 py-1 rounded flex items-center justify-between ${
                  currentMove === pair.white.idx 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span>{pair.white.move.san}</span>
                {(() => {
                  const style = getClassificationStyle(pair.white.idx)
                  return style ? (
                    <span style={{ color: style.color }} className="text-xs font-bold">
                      {style.symbol}
                    </span>
                  ) : null
                })()}
              </button>
              
              {/* Black move */}
              {pair.black ? (
                <button
                  onClick={() => onMoveClick(pair.black.idx)}
                  className={`text-left px-2 py-1 rounded flex items-center justify-between ${
                    currentMove === pair.black.idx 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <span>{pair.black.move.san}</span>
                  {(() => {
                    const style = getClassificationStyle(pair.black.idx)
                    return style ? (
                      <span style={{ color: style.color }} className="text-xs font-bold">
                        {style.symbol}
                      </span>
                    ) : null
                  })()}
                </button>
              ) : (
                <span></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          Make a move or import a game to start analysis
        </p>
      )}
    </div>
  )
}

export default AnalysisPanel
          
