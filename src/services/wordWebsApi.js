export class WordWebsAPI {
  constructor(accessToken = null) {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.accessToken = accessToken;
    
    if (!this.baseURL) {
      throw new Error('VITE_API_BASE_URL environment variable is required');
    }
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }

  async getDailyPuzzle() {
    try {
      console.log('WordWebsAPI: Fetching daily puzzle');
      const response = await fetch(`${this.baseURL}/daily-puzzle`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const puzzle = await response.json();
      console.log('WordWebsAPI: Daily puzzle received', puzzle);
      
      return puzzle;
    } catch (error) {
      console.error('WordWebsAPI: Error fetching daily puzzle:', error);
      throw new Error('Failed to load daily puzzle');
    }
  }

  async submitGuess(guessData) {
    try {
      console.log('WordWebsAPI: Submitting guess', guessData);
      const response = await fetch(`${this.baseURL}/submit-guess`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(guessData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('WordWebsAPI: Guess result received', result);
      
      return result;
    } catch (error) {
      console.error('WordWebsAPI: Error submitting guess:', error);
      throw new Error('Failed to submit guess');
    }
  }

  async getLeaderboard(date = null) {
    try {
      const url = date 
        ? `${this.baseURL}/leaderboard?date=${date}`
        : `${this.baseURL}/leaderboard`;
      
      console.log('WordWebsAPI: Fetching leaderboard', { date });
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const leaderboard = await response.json();
      console.log('WordWebsAPI: Leaderboard received', leaderboard);
      
      return leaderboard;
    } catch (error) {
      console.error('WordWebsAPI: Error fetching leaderboard:', error);
      throw new Error('Failed to load leaderboard');
    }
  }

  async getPlayerStats(discordId) {
    try {
      console.log('WordWebsAPI: Fetching player stats for', discordId);
      const url = discordId 
        ? `${this.baseURL}/player-stats?discord_id=${discordId}`
        : `${this.baseURL}/player-stats`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      console.log('WordWebsAPI: Player stats received', stats);
      
      return stats;
    } catch (error) {
      console.error('WordWebsAPI: Error fetching player stats:', error);
      throw new Error('Failed to load player stats');
    }
  }
}