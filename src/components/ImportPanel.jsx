import { useState } from 'react'
import useChesscomAPI from '../hooks/useChesscomAPI'

function ImportPanel({ onLoadGame }) {
  const [username, setUsername] = useState('')
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  
  const { fetchPlayerGames, fetchGamePGN, isLoading } = useChesscomAPI()

  const searchGames = async () => {
    if (!username) return
    
    setLoading(true)
    const date = new Date()
    const games = await fetchPlayerGames(
      username, 
      date.getFullYear(), 
      date.getMonth() + 1
    )
    setGames(games.slice(0, 10)) // Show last 10 games
    setLoading(false)
  }

  const loadGame = async (gameUrl) => {
    const pgn = await fetchGamePGN(gameUrl)
    if (pgn) {
      // Parse PGN and load
      const { parsePGN } = await import('../utils/pgnParser.js')
      const parsed = parsePGN(pgn)
      onLoadGame(parsed)
    }
  }

  const getGameTitle = (game) => {
    const white = game.white.username
    const black = game.black.username
    const result = game.white.result === 'win' ? '1-0' : 
                   game.black.result === 'win' ? '0-1' : '½-½'
    return `${white} vs ${black} (${result})`
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-bold text-white mb-4">Import from Chess.com</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-700 rounded text-white"
          onKeyPress={(e) => e.key === 'Enter' && searchGames()}
        />
        <button
          onClick={searchGames}
          disabled={isLoading || !username}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {games.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h3 className="text-sm text-gray-400">Recent Games:</h3>
          {games.map((game, idx) => (
            <button
              key={idx}
              onClick={() => loadGame(game.url)}
              className="w-full text-left p-3 bg-gray-700 rounded hover:bg-gray-600"
            >
              <div className="text-sm text-white">{getGameTitle(game)}</div>
              <div className="text-xs text-gray-400">
                {game.time_class} • {new Date(game.end_time * 1000).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImportPanel
