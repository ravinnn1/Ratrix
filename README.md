# Ratrix - Crypto Risk Scoring Playground

A real-time crypto token risk assessment simulator with an AI-powered risk intelligence engine.

## 🚀 Server Setup

The application now includes a Node.js/Express server that properly binds to `0.0.0.0` and uses the `PORT` environment variable.

### Requirements

- Node.js >= 14.0.0
- npm

### Installation

```bash
npm install
```

### Running the Server

#### Default (Port 3000)
```bash
npm start
```

#### Custom Port (via environment variable)
```bash
PORT=8080 npm start
```

Or on Windows:
```cmd
set PORT=8080 && npm start
```

#### Development Mode (with auto-reload)
```bash
npm run dev
```

### Server Configuration

- **Host:** `0.0.0.0` (binds to all network interfaces)
- **Port:** Uses `process.env.PORT` or defaults to `3000`
- **Static Files:** Serves all files from the project directory
- **Graceful Shutdown:** Handles SIGTERM and SIGINT signals

### Environment Variables

- `PORT` - The port number the server will listen on (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## 🎮 Features

- **Interactive Risk Calculator** - Adjust token variables in real-time
- **Dynamic Risk Gauge** - Visual SVG-based risk scoring
- **Risk Breakdown Analysis** - Detailed metrics for liquidity, holders, dev wallet, and supply
- **Live Leaderboard** - Real-time cryptocurrency risk scores via CoinGecko API
- **Terminal Interface** - Interactive CLI with easter eggs
- **PDF Report Generation** - Download professional audit reports
- **Cyberpunk Theme** - Neon green accents with matrix-style animations

## 📦 Deployment

### Heroku
```bash
git push heroku main
```

### Railway/Render
The server is configured to work automatically with these platforms as it:
- Binds to `0.0.0.0`
- Uses the `PORT` environment variable
- Includes proper package.json with start script

### Docker
```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE $PORT
CMD ["npm", "start"]
```

## 🛡️ Legal Disclaimer

This platform is for educational and entertainment purposes only. See the footer on the website for complete legal disclaimer.

## 📄 License

MIT License - See package.json for details

---

© 2025 Ratrix | All rights reserved
