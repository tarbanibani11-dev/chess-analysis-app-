import { useState, useRef, useCallback, useEffect } from 'react'

const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js'

export function useStockfish() {
  const [evaluation, setEvaluation] = useState(null)
  const [bestLine, setBestLine] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  
  const workerRef = useRef(null)
  const analysisTimeoutRef = useRef(null)

  // Initialize Stockfish worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        // Create worker from CDN
        const response = await fetch(STOCKFISH_URL)
        const script = await response.text()
        const blob = new Blob([script], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(blob)
        
        workerRef.current = new Worker(workerUrl)
        
        workerRef.current.onmessage = (e) => {
          const message = e.data
          handleEngineMessage(message)
        }
        
        // Initialize engine
        sendCommand('uci')
        sendCommand('setoption name Use NNUE value true')
        sendCommand('isready')
        
      } catch (error) {
        console.error('Failed to load Stockfish:', error)
        // Fallback: set dummy engine state
        setIsReady(true)
      }
    }
    
    initWorker()
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [])

  const sendCommand = useCallback((cmd) => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage(cmd)
    }
  }, [isReady])

  const handleEngineMessage = useCallback((message) => {
    if (typeof message !== 'string') return
    
    // Engine ready
    if (message.includes('readyok')) {
      setIsReady(true)
    }
    
    // Parse evaluation info
    if (message.startsWith('info') && message.includes('score')) {
      const scoreMatch = message.match(/score (cp|mate) (-?\d+)/)
      const pvMatch = message.match(/pv ([a-h][1-8][a-h][1-8][qrbn]?.*?)(?= |$)/)
      
      if (scoreMatch) {
        const type = scoreMatch[1]
        const value = parseInt(scoreMatch[2])
        
        // Adjust for side to move (engine gives score from engine's POV)
        const adjustedValue = message.includes('wtime') ? value : -value
        
        setEvaluation({
          type,
          value: type === 'cp' ? adjustedValue : adjustedValue,
          originalValue: value
        })
      }
      
      if (pvMatch) {
        const moves = pvMatch[1].trim().split(' ')
        setBestLine(moves)
      }
    }
    
    // Best move found
    if (message.startsWith('bestmove')) {
      setIsAnalyzing(false)
    }
  }, [])

  const startAnalysis = useCallback((fen, depth = 18) => {
    if (!isReady) return
    
    setIsAnalyzing(true)
    setBestLine([])
    
    // Clear previous analysis
    sendCommand('stop')
    
    // Start new analysis
    sendCommand(`position fen ${fen}`)
    sendCommand(`go depth ${depth}`)
    
    // Auto-stop after 3 seconds for responsiveness
    analysisTimeoutRef.current = setTimeout(() => {
      stopAnalysis()
    }, 3000)
  }, [isReady, sendCommand])

  const stopAnalysis = useCallback(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }
    sendCommand('stop')
    setIsAnalyzing(false)
  }, [sendCommand])

  const getBestMove = useCallback((fen, callback) => {
    if (!isReady) return
    
    const tempHandler = (e) => {
      const message = e.data
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1]
        callback(move)
        workerRef.current.onmessage = (ev) => handleEngineMessage(ev.data)
      }
    }
    
    workerRef.current.onmessage = (e) => tempHandler(e)
    sendCommand(`position fen ${fen}`)
    sendCommand('go movetime 1000')
  }, [isReady, sendCommand, handleEngineMessage])

  return {
    evaluation,
    bestLine,
    isAnalyzing,
    isReady,
    startAnalysis,
    stopAnalysis,
    getBestMove
  }
}

export default useStockfish
