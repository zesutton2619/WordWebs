export class WordWebsAPI {
  constructor(accessToken = null) {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.accessToken = accessToken;

    if (!this.baseURL) {
      throw new Error("VITE_API_BASE_URL environment variable is required");
    }
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  async getDailyPuzzle() {
    try {
      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/daily-puzzle`, {
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const puzzle = await response.json();
      return puzzle;
    } catch (error) {
      console.error("WordWebsAPI: Error fetching daily puzzle:", error);
      throw new Error("Failed to load daily puzzle");
    }
  }


  async getLeaderboard(date = null) {
    try {
      const url = date
        ? `${this.baseURL}/leaderboard?date=${date}`
        : `${this.baseURL}/leaderboard`;

      console.log("WordWebsAPI: Fetching leaderboard", { date });
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const leaderboard = await response.json();
      console.log("WordWebsAPI: Leaderboard received", leaderboard);

      return leaderboard;
    } catch (error) {
      console.error("WordWebsAPI: Error fetching leaderboard:", error);
      throw new Error("Failed to load leaderboard");
    }
  }


  async getGameState(date = null) {
    try {
      const url = date
        ? `${this.baseURL}/game-state?date=${date}`
        : `${this.baseURL}/game-state`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const gameState = await response.json();
      return gameState;
    } catch (error) {
      console.error("WordWebsAPI: Error fetching game state:", error);
      throw new Error("Failed to load game state");
    }
  }

  async saveGameProgress(progressData) {
    try {
      const response = await fetch(`${this.baseURL}/save-progress`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("WordWebsAPI: Error saving progress:", error);
      throw new Error("Failed to save game progress");
    }
  }
}
