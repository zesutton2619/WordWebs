import { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

export const useDiscord = () => {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeDiscord = async () => {
      // Check if we're running in Discord's iframe context
      const isInDiscord = window.parent !== window || new URLSearchParams(window.location.search).has('frame_id');
      
      if (!isInDiscord) {
        console.log('Running outside Discord - using development mode');
        setUser({
          id: 'dev_user',
          username: 'DevUser',
          avatar: null,
        });
        setIsLoading(false);
        return;
      }

      try {
        console.log('Initializing Discord SDK...');
        const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
        
        if (!DISCORD_CLIENT_ID) {
          throw new Error('Discord Client ID not found in environment variables');
        }

        // Initialize Discord SDK
        const sdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await sdk.ready();
        console.log('Discord SDK ready');
        
        // Authorize with Discord
        console.log('Requesting Discord authorization...');
        const { code } = await sdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds'],
        });

        console.log('Authorization successful, exchanging code for token...');
        
        // Exchange the authorization code for an access token via our backend
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/discord-oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful');

        // Authenticate with the Discord SDK using the access token
        const authenticatedUser = await sdk.commands.authenticate({
          access_token: tokenData.access_token,
        });

        console.log('Authentication successful:', authenticatedUser);
        setDiscordSdk(sdk);
        setAuth(tokenData);
        setUser(tokenData.user); // Use user data from our backend
        setIsLoading(false);
      } catch (err) {
        console.error('Discord SDK initialization failed:', err);
        setError(err.message);
        setIsLoading(false);
        
        // Fallback to development user
        setUser({
          id: 'dev_user',
          username: 'DevUser',
          avatar: null,
        });
      }
    };

    initializeDiscord();
  }, []);

  return {
    discordSdk,
    auth,
    user,
    isLoading,
    error,
  };
};