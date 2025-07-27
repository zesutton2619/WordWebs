import { useState, useEffect, useRef } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";

export const useDiscord = () => {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent duplicate initialization
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls from React StrictMode
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    const initializeDiscord = async () => {
      // Check if we're running in Discord's iframe context
      const isInFrame = window.parent !== window;
      const hasFrameId = new URLSearchParams(window.location.search).has(
        "frame_id"
      );
      const isInDiscord = isInFrame || hasFrameId;

      if (!isInDiscord) {
        setError("This app must be run within Discord");
        setIsLoading(false);
        return;
      }

      try {
        const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

        if (!DISCORD_CLIENT_ID) {
          throw new Error(
            "Discord Client ID not found in environment variables"
          );
        }

        // Initialize Discord SDK
        const sdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await sdk.ready();

        // Authorize with Discord
        const authResult = await sdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds"],
        });

        const { code } = authResult;

        // Exchange code for token
        const tokenResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/discord-oauth/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          }
        );

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(
            `Failed to exchange code for token: ${tokenResponse.status} ${errorText}`
          );
        }

        const tokenData = await tokenResponse.json();

        // Authenticate with the Discord SDK using the access token
        await sdk.commands.authenticate({
          access_token: tokenData.access_token,
        });

        setDiscordSdk(sdk);
        setAuth(tokenData);
        setUser(tokenData.user);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
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