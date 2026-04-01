import { useMemo } from 'react'

function EvaluationGraph({ history, currentMove }) {
  // Generate fake eval history for display (real app would store eval per move)
  const dataPoints = useMemo(() => {
    // Placeholder: random walk for demo
    // Real implementation: store engine eval after each move
    const points = []
    let value = 0
    
    for (let i = 0; i <= history.length; i++) {
      // Simulate some evaluation changes
      value += (Math.random() - 0.5) * 100
      value = Math.max(-500, Math.min(500, value)) // Clamp
      points.push({
        move: i,
        value: value,
        isCurrent: i === currentMove + 1
      })
    }
    
    return points
  }, [history.length, currentMove])

  const maxVal = 500
  const minVal = -500
  const range = maxVal - minVal

  const getY = (value) => {
    return 100 - ((value - minVal) / range) * 100
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
            d={`${pathData} L 100 100 L 0 100 Z`}
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
          
          {/* Current move indicator */}
          {dataPoints.map((point, i) => (
            point.isCurrent && (
              <circle
                key={i}
                cx={(i / (dataPoints.length - 1 || 1)) * 100}
                cy={getY(point.value)}
                r="3"
                fill="#60A5FA"
                vectorEffect="non-scaling-stroke"
              />
            )
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
