# WordWebs - Discord Activity

A Discord Activity featuring NYT Connections-style word puzzles. Players find four groups of four related words within Discord's embedded app framework.

## Features

- **Discord Activity Integration**: Runs natively within Discord using the Embedded App SDK
- **Daily Puzzles**: New NYT Connections-style puzzles generated daily at midnight EST
- **Discord Authentication**: Seamless OAuth flow with Discord SDK
- **Real-time Gameplay**: Interactive word selection and group validation
- **Leaderboards**: Track daily progress and compare with other players
- **Automatic Daily Summaries**: Wordle-style daily results posted to Discord channels
- **Visual Game State**: Canvas-based images showing game attempts and results

## Technology Stack

- **React 19** with Vite for fast development
- **Motion (Framer Motion)** for smooth animations
- **Tailwind CSS 4** for styling
- **Discord Embedded App SDK** for Discord integration
- **Serverless Lambda API** for backend functionality

## Development Setup

### Prerequisites

- Node.js 18+ installed
- Discord Developer Application configured
- Cloudflare Tunnel for local development (or ngrok alternative)

### Environment Variables

Create a `.env` file:

```env
VITE_DISCORD_CLIENT_ID=your-discord-client-id
VITE_API_BASE_URL=/.proxy/api
```

### Discord Developer Portal Setup

1. **Create Discord Application** at https://discord.com/developers/applications
2. **Enable Activities**: Under Settings → Activities
3. **Configure URL Mappings**:
   - **Root Mapping**: `/` → `your-development-url.trycloudflare.com`
   - **Proxy Path Mapping**: `/.proxy/api` → `https://your-lambda-url.lambda-url.us-east-1.on.aws`
4. **OAuth2 Redirects**: Add your development URL and production URL

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start Cloudflare tunnel
npx cloudflared tunnel --url http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Discord Activity Development Workflow

1. **Start Development Server**: `npm run dev`
2. **Start Tunnel**: `npx cloudflared tunnel --url http://localhost:5173`
3. **Update Discord Dev Portal**: Add the tunnel URL to Discord URL mappings
4. **Test in Discord**: Open your activity in a Discord server

## Architecture

### Core Components

- **WordWebs.jsx** - Main game component with puzzle state and game logic
- **DiscordProvider.jsx** - Discord SDK context provider
- **useDiscord.js** - Custom hook for Discord authentication and SDK interactions

### Utility Components

- **gameStateImage.js** - Canvas-based image generation for game state visualization

### Discord Integration

- **OAuth Flow**: Automatic Discord authentication using embedded app SDK
- **User Context**: Discord user information available throughout the app
- **Proxy Routing**: API calls routed through Discord's proxy system

### API Integration

The frontend communicates with a serverless Lambda API:

- **Base URL**: `/.proxy/api` (routed through Discord proxy)
- **Endpoints**: Daily puzzles, guess submission, leaderboards, player stats
- **Authentication**: Discord OAuth tokens passed to API

## Game Logic

- **16 words** arranged in a 4x4 grid
- **4 groups** of 4 related words each
- **Difficulty levels** 1-4 (color-coded: green, yellow, orange, red)
- **4 attempts** to solve all groups
- **Progressive revelation** of solved groups

## Deployment

### Production Setup

1. **Build the application**: `npm run build`
2. **Deploy to hosting platform** (Render, Vercel, etc.)
3. **Update Discord Developer Portal**:
   - Root mapping: `/` → `your-production-url.com`
   - Keep proxy mapping: `/.proxy/api` → `your-lambda-url`
4. **Update environment variables** for production

### Environment Configuration

- **Development**: Uses Cloudflare tunnels with `.proxy` routing
- **Production**: Direct hosting with Discord proxy for API calls

## Discord Activity Requirements

- Must run within Discord's embedded iframe
- Requires proper Discord SDK initialization
- OAuth authentication handled automatically
- All external API calls must go through Discord's proxy system

## Troubleshooting

### Common Issues

- **Black screen**: Check Discord SDK initialization and OAuth flow
- **API errors**: Verify proxy path mappings in Discord Developer Portal
- **Authentication failed**: Check Discord client ID and redirect URLs
- **CORS errors**: Ensure API endpoints have proper CORS headers

### Development Tips

- Use Discord's test client for easier debugging
- Check browser console for Discord SDK messages
- Verify tunnel URLs are accessible externally
- Test OAuth flow in incognito mode