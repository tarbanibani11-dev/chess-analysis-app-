import { useState, useCallback } from 'react'

const BASE_URL = 'https://api.chess.com/pub'

export function useChesscomAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPlayerStats = useCallback(async (username) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${BASE_URL}/player/${username}/stats`)
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
      const response = await fetch(
        `${BASE_URL}/player/${username}/games/${year}/${mm}`
      )
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

  const fetchCurrentDailyGames = useCallback(async (username) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${BASE_URL}/player/${username}/games`)
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
      const response = await fetch(gameUrl)
      if (!response.ok) throw new Error('PGN not found')
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
    fetchCurrentDailyGames,
    fetchGamePGN
  }
}

export default useChesscomAPI
