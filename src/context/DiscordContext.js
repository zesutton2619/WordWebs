import { createContext, useContext } from 'react';

export const DiscordContext = createContext();

export const useDiscordContext = () => {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscordContext must be used within a DiscordProvider');
  }
  return context;
};