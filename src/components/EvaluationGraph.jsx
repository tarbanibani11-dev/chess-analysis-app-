  import { useMemo } from 'react'

function EvaluationGraph({ history, currentMove, classifications }) {
  // Generate eval history from classifications
  const dataPoints = useMemo(() => {
    const points = []
    let cumulativeEval = 0
    
    for (let i = 0; i <= history.length; i++) {
      // Use classification loss to estimate eval
      const cls = classifications[i - 1]
      if (cls) {
        cumulativeEval += (i % 2 === 1 ? 1 : -1) * cls.loss
      }
      
      // Clamp between -500 and 500
      cumulativeEval = Math.max(-500, Math.min(500, cumulativeEval))
      
      points.push({
        move: i,
        value: cumulativeEval,
        isCurrent: i === currentMove + 1,
        classification: cls
      })
    }
    
    return points
  }, [history.length, currentMove, classifications])

  const maxVal = 500
  const minVal = -500
  const range = maxVal - minVal

  const getY = (value) => {
    return 100 - ((value - minVal) / range) * 100
  }

  const getColor = (point) => {
    if (!point.classification) return '#81B64C'
    const colors = {
      brilliant: '#1baca6',
      great: '#81b64c',
      best: '#81b64c',
      excellent: '#81b64c',
      good: '#a0a0a0',
      inaccuracy: '#f0c14c',
      mistake: '#e58f2a',
      blunder: '#ca3431'
    }
    return colors[point.classification.class] || '#81B64C'
  }

  if (history.length < 2) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Evaluation Graph</h3>
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
          Not enough moves
        </div>
      </div>
    )
  }

  const pathData = dataPoints.map((point, i) => {
    const x = (i / (dataPoints.length - 1 || 1)) * 100
    const y = getY(point.value)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-bold text-gray-400 mb-2">Evaluation Graph</h3>
      
      <div className="relative h-32 bg-gray-900 rounded overflow-hidden">
        {/* Center line (0.0) */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-600" />
        
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Area under curve */}
          <path
            d={`${pathData} L 100 50 L 0 50 Z`}
            fill="rgba(129, 182, 76, 0.2)"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#81B64C"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={(i / (dataPoints.length - 1 || 1)) * 100}
              cy={getY(point.value)}
              r={point.isCurrent ? "3" : "1.5"}
              fill={point.isCurrent ? "#60A5FA" : getColor(point)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        
        {/* Labels */}
        <div className="absolute left-1 top-1 text-xs text-gray-500">+5</div>
        <div className="absolute left-1 bottom-1 text-xs text-gray-500">-5</div>
      </div>
    </div>
  )
}

export default EvaluationGraph
  
