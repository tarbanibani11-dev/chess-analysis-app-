import { useState, useCallback } from 'react'

// Use CORS proxy for Chess.com API
const CORS_PROXY = 'https://api.allorigins.win/raw?url='
const BASE_URL = 'https://api.chess.com/pub'

export function useChesscomAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPlayerStats = useCallback(async (username) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/player/${username}/stats`)}`)
      if (!response.ok) throw new Error('Player not found')
      return await response.json()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPlayerGames = useCallback(async (username, year, month) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const mm = month.toString().padStart(2, '0')
      const url = `${BASE_URL}/player/${username}/games/${year}/${mm}`
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`)
      
      if (!response.ok) throw new Error('Games not found')
      const data = await response.json()
      return data.games || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchGamePGN = useCallback(async (gameUrl) => {
    try {
      // Chess.com game URL to PGN
      const pgnUrl = gameUrl.replace('/live/', '/live/games/').replace('/daily/', '/daily/games/')
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(pgnUrl + '/pgn')}`)
      
      if (!response.ok) {
        // Try alternative URL format
        const altResponse = await fetch(`${CORS_PROXY}${encodeURIComponent(gameUrl + '/pgn')}`)
        if (!altResponse.ok) throw new Error('PGN not found')
        return await altResponse.text()
      }
      
      return await response.text()
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  return {
    isLoading,
    error,
    fetchPlayerStats,
    fetchPlayerGames,
    fetchGamePGN
  }
}

export default useChesscomAPI
