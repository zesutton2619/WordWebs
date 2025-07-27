import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { useDiscordContext } from '../context/DiscordContext';
import { WordWebsAPI } from '../services/wordWebsApi';

const WordWebs = () => {
  const { user, auth } = useDiscordContext();
  
  // Create API instance once
  const apiRef = useRef(null);
  if (!apiRef.current) {
    try {
      apiRef.current = new WordWebsAPI();
    } catch (error) {
      console.error('Failed to create WordWebsAPI instance:', error);
    }
  }

  // Update API token when auth changes
  useEffect(() => {
    if (apiRef.current && auth?.access_token) {
      apiRef.current.setAccessToken(auth.access_token);
    }
  }, [auth]);

  // Puzzle state
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [selectedWords, setSelectedWords] = useState([]);
  const [solvedGroups, setSolvedGroups] = useState([]);
  const [attempts, setAttempts] = useState(4);
  const [gameStatus, setGameStatus] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Game session tracking
  const [allGuesses, setAllGuesses] = useState([]);
  const [gameStartTime] = useState(Date.now());
  
  // Ref to prevent duplicate API calls in development
  const hasLoadedPuzzle = useRef(false);

  // Load puzzle on component mount
  useEffect(() => {
    if (hasLoadedPuzzle.current) {
      console.log('WordWebs: Puzzle already loaded, skipping duplicate call');
      return;
    }
    const loadPuzzle = async () => {
      try {
        console.log('WordWebs: Starting to load daily puzzle');
        hasLoadedPuzzle.current = true;
        setPuzzleLoading(true);
        
        console.log('WordWebs: Using API client');
        if (!apiRef.current) {
          throw new Error('API client not available');
        }
        
        console.log('WordWebs: Fetching daily puzzle');
        const puzzle = await apiRef.current.getDailyPuzzle();
        
        console.log('WordWebs: Puzzle received', puzzle);
        setCurrentPuzzle(puzzle);
        setShuffledWords([...puzzle.words].sort(() => Math.random() - 0.5));
        
        console.log('WordWebs: Game ready');
      } catch (err) {
        console.error('WordWebs: Failed to load puzzle:', err);
        setGameStatus('Failed to load daily puzzle');
      } finally {
        setPuzzleLoading(false);
      }
    };

    loadPuzzle();
    
    // Cleanup function
    return () => {
      console.log('WordWebs: Component cleanup');
    };
  }, []);

  const handleWordClick = (word) => {
    if (
      isGameOver ||
      solvedGroups.some((group) => group.words.includes(word))
    ) {
      return; // Don't allow clicking solved words or if game is over
    }

    if (selectedWords.includes(word)) {
      // Deselect word
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else if (selectedWords.length < 4) {
      // Select word (max 4)
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = async () => {
    if (selectedWords.length !== 4 || !currentPuzzle) return;

    console.log('WordWebs: Validating guess', selectedWords);
    
    // Track the guess
    const guess = {
      words: [...selectedWords],
      timestamp: Date.now()
    };
    const newAllGuesses = [...allGuesses, guess];
    setAllGuesses(newAllGuesses);

    // Check if selected words form a group locally
    const matchingGroup = currentPuzzle.groups?.find(group => 
      selectedWords.every(word => group.words.includes(word)) &&
      group.words.every(word => selectedWords.includes(word))
    );

    if (matchingGroup) {
      // Correct group found!
      console.log('WordWebs: Correct group found', matchingGroup);
      setSolvedGroups([...solvedGroups, matchingGroup]);
      setSelectedWords([]);

      // Check if all groups solved
      const newSolvedCount = solvedGroups.length + 1;
      if (newSolvedCount === currentPuzzle.groups?.length) {
        setGameStatus("🎉 Congratulations! You solved the puzzle!");
        setIsGameOver(true);
        
        // Submit final game session
        await submitFinalSession(newAllGuesses, true, Date.now() - gameStartTime);
      }
    } else {
      // Wrong group
      console.log('WordWebs: Incorrect guess');
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      setSelectedWords([]);

      if (newAttempts === 0) {
        setGameStatus("😞 Game Over! No attempts remaining.");
        setIsGameOver(true);
        
        // Submit final game session
        await submitFinalSession(newAllGuesses, false, Date.now() - gameStartTime);
      }
    }
  };

  const submitFinalSession = async (finalGuesses, completed, completionTime) => {
    try {
      if (!apiRef.current) return;
      
      console.log('WordWebs: Submitting final game session');
      
      await apiRef.current.submitGuess({
        puzzle_id: currentPuzzle.id,
        guess: [], // Not used for final submission
        is_final: true,
        completed,
        completion_time: Math.round(completionTime / 1000), // Convert to seconds
        all_guesses: finalGuesses.map(g => g.words)
      });
      
      console.log('WordWebs: Final session submitted successfully');
    } catch (error) {
      console.error('WordWebs: Error submitting final session:', error);
    }
  };

  const handleClear = () => {
    setSelectedWords([]);
  };

  // Get remaining words that haven't been solved
  const remainingWords = shuffledWords.filter(
    (word) => !solvedGroups.some((group) => group.words.includes(word))
  );

  // Get grid class based on remaining words
  const getRemainingGridClass = () => {
    const remaining = remainingWords.length;
    if (remaining === 16) return "grid-cols-4"; // 4x4
    if (remaining === 12) return "grid-cols-4"; // 3x4
    if (remaining === 8) return "grid-cols-4"; // 2x4
    if (remaining === 4) return "grid-cols-4"; // 1x4
    return "grid-cols-4";
  };

  const getWordButtonClass = (word) => {
    const baseClass = "w-full h-16 rounded-lg font-medium text-sm border-2";

    // Check if word is selected
    if (selectedWords.includes(word)) {
      return `${baseClass} bg-purple-500 border-purple-400 text-white hover:bg-purple-400`;
    }

    // Default unselected state
    return `${baseClass} bg-slate-700 border-slate-600 text-white hover:bg-slate-600 cursor-pointer`;
  };

  const getSolvedGroupColor = (difficulty) => {
    const colors = {
      1: "bg-green-600 border-green-500",
      2: "bg-blue-600 border-blue-500",
      3: "bg-purple-600 border-purple-500",
      4: "bg-red-600 border-red-500",
    };
    return colors[difficulty] || "bg-gray-600 border-gray-500";
  };

  // Show loading state only for puzzle
  if (puzzleLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-300">Loading daily puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-md w-full relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">🕸️ WordWebs</h1>
          <p className="text-slate-300 mb-2">
            Find four groups of four related words!
          </p>
          {user && (
            <p className="text-slate-400 text-sm">
              Playing as {user.username}
            </p>
          )}
        </div>

        {/* Game Status */}
        {gameStatus && (
          <div className="text-center mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              {gameStatus}
            </div>
          </div>
        )}

        {/* Game Area - Compact Container */}
        <div>
          {/* Solved Groups Display - Horizontal Rows */}
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {solvedGroups
                .sort((a, b) => a.difficulty - b.difficulty)
                .map((group) => (
                <motion.div
                  key={group.category}
                  layout
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  style={{ transformOrigin: "top" }}
                  className="mb-3"
                >
                  <div
                    className={`${getSolvedGroupColor(
                      group.difficulty
                    )} rounded-lg p-3 text-white text-center border-2`}
                  >
                    <div className="font-semibold text-sm mb-1">
                      {group.category}
                    </div>
                    <div className="text-xs opacity-90">
                      {group.words.join(" • ")}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Remaining Words Grid */}
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`grid ${getRemainingGridClass()} gap-3 my-4 relative`}
          >
            <AnimatePresence mode="popLayout">
              {remainingWords.map((word) => (
                <motion.button
                  key={word}
                  layout="position"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    layout: { duration: 0.3, ease: "easeInOut" },
                    exit: { duration: 0.1, ease: "easeIn" },
                  }}
                  onClick={() => handleWordClick(word)}
                  className={getWordButtonClass(word)}
                  disabled={isGameOver}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ position: 'relative' }}
                >
                  {word}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Attempts as dots */}
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < attempts ? "bg-white" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={selectedWords.length !== 4 || isGameOver}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer text-white font-medium rounded-lg transition-colors"
          >
            Submit Group
          </button>
          <button
            onClick={handleClear}
            disabled={selectedWords.length === 0 || isGameOver}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer text-white font-medium rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordWebs;
