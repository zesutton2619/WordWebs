import { DiscordProvider } from './components/DiscordProvider'
import WordWebs from './components/WordWebs'

function App() {
  return (
    <DiscordProvider>
      <div className="min-h-screen bg-slate-900 text-white">
        <WordWebs />
      </div>
    </DiscordProvider>
  )
}

export default App
