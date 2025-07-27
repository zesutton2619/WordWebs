import { DiscordContext } from '../context/DiscordContext';
import { useDiscord } from '../hooks/useDiscord';

export const DiscordProvider = ({ children }) => {
  const discord = useDiscord();

  return (
    <DiscordContext.Provider value={discord}>
      {children}
    </DiscordContext.Provider>
  );
};