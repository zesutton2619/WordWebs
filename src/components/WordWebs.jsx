import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { useDiscordContext } from "../context/DiscordContext";
import { WordWebsAPI } from "../services/wordWebsApi";
import { generateGameStateImage } from "../utils/gameStateImage";

const WordWebs = () => {
  const {
    user,
    auth,
    discordSdk,
    isLoading: discordLoading,
    error: discordError,
  } = useDiscordContext();

  // Create API instance once
  const apiRef = useRef(null);
  if (!apiRef.current) {
    try {
      apiRef.current = new WordWebsAPI();
    } catch {
      // API client initialization failed
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
  const [wrongGuessShake, setWrongGuessShake] = useState(false);
  const [nearMissMessage, setNearMissMessage] = useState("");

  // Game session tracking (now from backend)
  const [gameStartTime] = useState(Date.now());
  const [allGuesses, setAllGuesses] = useState([]);

  // Ref to prevent duplicate API calls in development
  const hasLoadedPuzzle = useRef(false);

  // Load puzzle and game state after Discord authentication is complete
  useEffect(() => {
    if (hasLoadedPuzzle.current) {
      return;
    }

    // Wait for Discord authentication to complete
    if (discordLoading) {
      return;
    }

    if (discordError) {
      setGameStatus("Discord authentication failed");
      setPuzzleLoading(false);
      return;
    }

    if (!user || !auth) {
      setGameStatus("Authentication required");
      setPuzzleLoading(false);
      return;
    }

    const loadPuzzleAndGameState = async () => {
      try {
        hasLoadedPuzzle.current = true;
        setPuzzleLoading(true);

        if (!apiRef.current) {
          throw new Error("API client not available");
        }

        // Load puzzle first
        const puzzle = await apiRef.current.getDailyPuzzle();
        setCurrentPuzzle(puzzle);
        setShuffledWords([...puzzle.words].sort(() => Math.random() - 0.5));

        // Load existing game state
        const gameState = await apiRef.current.getGameState();

        if (gameState.game_status === "completed") {
          setGameStatus("🎉 You have already completed today's puzzle!");
          setSolvedGroups(gameState.solved_groups || []);
          setAttempts(gameState.attempts_remaining || 0);
          setIsGameOver(true);
        } else if (gameState.game_status === "failed") {
          setGameStatus("😞 You already used all attempts for today's puzzle.");
          setSolvedGroups(gameState.solved_groups || []);
          setAttempts(0);
          setIsGameOver(true);
        } else if (gameState.game_status === "in_progress") {
          // Restore existing progress
          setSolvedGroups(gameState.solved_groups || []);
          setSelectedWords(gameState.selected_words || []);
          setAttempts(gameState.attempts_remaining || 4);
          setGameStatus("");
        } else {
          // New game
          setGameStatus("");
        }
      } catch (error) {
        console.error("Error loading puzzle/game state:", error);
        if (error.message.includes("already completed")) {
          setGameStatus("🎉 You have already completed today's puzzle!");
          setIsGameOver(true);
        } else {
          setGameStatus("Failed to load daily puzzle");
        }
      } finally {
        setPuzzleLoading(false);
      }
    };

    loadPuzzleAndGameState();
  }, [user, auth, discordLoading, discordError]);

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

    try {
      // Check if selected words form a group locally
      const matchingGroup = currentPuzzle.groups?.find(
        (group) =>
          selectedWords.every((word) => group.words.includes(word)) &&
          group.words.every((word) => selectedWords.includes(word))
      );

      let newSolvedGroups = [...solvedGroups];
      let newAttempts = attempts;
      let completionTime = null;

      if (matchingGroup) {
        // Correct group found!
        newSolvedGroups = [...solvedGroups, matchingGroup];
        setSolvedGroups(newSolvedGroups);

        // Check if all groups solved
        if (newSolvedGroups.length === currentPuzzle.groups?.length) {
          setGameStatus("🎉 Congratulations! You solved the puzzle!");
          setIsGameOver(true);
          completionTime = Math.round((Date.now() - gameStartTime) / 1000);
        }
      } else {
        // Wrong group - check for near miss (3/4 correct)
        let correctWordsCount = 0;

        for (const group of currentPuzzle.groups) {
          const matchingWords = selectedWords.filter((word) =>
            group.words.includes(word)
          );
          if (matchingWords.length > correctWordsCount) {
            correctWordsCount = matchingWords.length;
          }
        }

        // Trigger shake animation
        setWrongGuessShake(true);
        setTimeout(() => setWrongGuessShake(false), 600);

        newAttempts = attempts - 1;
        setAttempts(newAttempts);

        if (correctWordsCount === 3) {
          setNearMissMessage("One word is off!");
          setTimeout(() => setNearMissMessage(""), 3000);
        } else {
          setNearMissMessage("");
        }

        if (newAttempts === 0) {
          setGameStatus("😞 Game Over! No attempts remaining.");
          setIsGameOver(true);
        }
      }

      // Track this guess
      const newGuess = {
        words: [...selectedWords],
        isCorrect: !!matchingGroup,
        timestamp: Date.now(),
      };
      const updatedGuesses = [...allGuesses, newGuess];
      setAllGuesses(updatedGuesses);

      // Always clear selected words after guess
      setSelectedWords([]);

      // Get Discord channel ID and guild ID for messaging
      let channelId = null;
      let guildId = null;
      let imageData = null;

      // Check if Discord messaging should happen for significant events
      const shouldSendDiscordMessage =
        newSolvedGroups.length === currentPuzzle.groups?.length || // Game completed
        newAttempts === 0 || // Game failed
        matchingGroup || // Found a group
        (!matchingGroup && newAttempts < attempts); // Failed attempt (wrong guess)

      if (shouldSendDiscordMessage && discordSdk && user) {
        try {
          // Get channel ID and guild ID
          try {
            const channelInfo = await discordSdk.commands.getChannel();
            channelId = channelInfo?.id || channelInfo?.channel_id;
            guildId = channelInfo?.guild_id;
          } catch {
            // Try alternative methods to get channel and guild ID
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const channelIdFromUrl = urlParams.get("channel_id");
              const guildIdFromUrl = urlParams.get("guild_id");

              if (channelIdFromUrl) {
                channelId = channelIdFromUrl;
                guildId = guildIdFromUrl;
              } else {
                const instanceId =
                  await discordSdk.commands.getInstanceConnectParams();
                channelId = instanceId?.channel_id;
                guildId = instanceId?.guild_id;
              }
            } catch (altError) {
              console.error("Failed to get channel/guild ID:", altError);
            }
          }

          // Generate game state image
          if (channelId) {
            const puzzleNumber = extractPuzzleNumber(
              currentPuzzle.date || new Date().toISOString().split("T")[0]
            );
            // Use display name for image generation
            const userForImage = {
              ...user,
              username: user.display_name || user.username,
            };
            imageData = await generateGameStateImage(
              updatedGuesses,
              newSolvedGroups,
              userForImage,
              puzzleNumber,
              newAttempts
            );
          }
        } catch (error) {
          console.error("Error preparing Discord messaging data:", error);
        }
      }

      // Save progress to backend (backend handles Discord messaging automatically)
      await apiRef.current.saveGameProgress({
        puzzle_id: currentPuzzle.id,
        guess: [...selectedWords],
        attempts_remaining: newAttempts,
        solved_groups: newSolvedGroups,
        selected_words: [],
        completion_time: completionTime,
        // Discord messaging data - backend will use these if present
        channel_id: channelId,
        guild_id: guildId,
        image_data: imageData,
        puzzle_number: extractPuzzleNumber(
          currentPuzzle.date || new Date().toISOString().split("T")[0]
        ),
      });
    } catch (error) {
      console.error("Error submitting guess:", error);
      setGameStatus("Error saving progress. Please try again.");
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
      2: "bg-yellow-600 border-yellow-500",
      3: "bg-orange-600 border-orange-500",
      4: "bg-red-600 border-red-500",
    };
    return colors[difficulty] || "bg-gray-600 border-gray-500";
  };

  // Show Discord error state
  if (discordError) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            ❌
          </div>
          <p className="text-red-300 mb-2">Discord Authentication Failed</p>
          <p className="text-slate-400 text-sm">{discordError}</p>
        </div>
      </div>
    );
  }

  // Show loading state for Discord auth or puzzle loading
  if (puzzleLoading) {
    let loadingMessage = "Loading...";
    if (discordLoading) {
      loadingMessage = "Connecting to Discord...";
    } else if (puzzleLoading) {
      loadingMessage = "Loading daily puzzle...";
    }

    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-300">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Show Discord loading state
  if (discordLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-pulse h-12 w-12 bg-slate-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Connecting to Discord...</p>
          <p className="text-slate-400 text-sm mt-2">
            Please authorize the app when prompted
          </p>
        </div>
      </div>
    );
  }

  // Show auth error state
  if (discordError) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            ❌
          </div>
          <p className="text-red-300 mb-2">Discord Authentication Failed</p>
          <p className="text-slate-400 text-sm">{discordError}</p>
        </div>
      </div>
    );
  }

  // Show auth waiting state if no user yet
  if (!user || !auth) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-pulse h-12 w-12 bg-slate-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Waiting for Discord authorization...</p>
          <p className="text-slate-400 text-sm mt-2">
            Please check for Discord authorization prompt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-md w-full relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">🕸️ Word Webs</h1>
          <p className="text-slate-300 mb-2">
            Find four groups of four related words!
          </p>
          {user && (
            <p className="text-slate-400 text-sm">
              Playing as {user.display_name || user.username}
            </p>
          )}
        </div>

        {/* Game Status */}
        {gameStatus && (
          <div className="text-center mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2">
              {gameStatus}
            </div>
          </div>
        )}

        {/* Near Miss Message */}
        {nearMissMessage && (
          <div className="text-center mb-4">
            <div className="bg-yellow-800 border border-yellow-600 rounded-lg p-2 text-yellow-200">
              {nearMissMessage}
            </div>
          </div>
        )}

        {/* Game Area - Compact Container */}
        <div>
          {/* Solved Groups Display - Horizontal Rows */}
          <div className="grid grid-cols-4 gap-3 p-2">
            <motion.div layout className="space-y-2 col-span-4">
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
                        ease: "easeInOut",
                      }}
                      style={{ transformOrigin: "top" }}
                      className=""
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
          </div>

          {/* Remaining Words Grid */}
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`grid ${getRemainingGridClass()} gap-3 mb-4 relative p-2`}
          >
            <AnimatePresence mode="popLayout">
              {remainingWords.map((word) => (
                <motion.button
                  key={word}
                  layout="position"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => handleWordClick(word)}
                  className={getWordButtonClass(word)}
                  disabled={isGameOver}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    x:
                      wrongGuessShake && selectedWords.includes(word)
                        ? [0, -10, 10, -10, 10, 0]
                        : 0,
                  }}
                  transition={{
                    layout: { duration: 0.3, ease: "easeInOut" },
                    exit: { duration: 0.1, ease: "easeIn" },
                    x: { duration: 0.6, ease: "easeInOut" },
                  }}
                  style={{ position: "relative" }}
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

// Helper function to extract puzzle number from date
const extractPuzzleNumber = (dateString) => {
  const launchDate = new Date("2025-07-30");
  const puzzleDate = new Date(dateString);
  const diffTime = puzzleDate - launchDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export default WordWebs;
