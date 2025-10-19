const express = require('express');
const path = require('path');

const app = express();

// Get PORT from environment variable or default to 3000
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404s
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server on 0.0.0.0 with the PORT environment variable
app.listen(PORT, HOST, () => {
    console.log(`[SUCCESS] Ratrix server online`);
    console.log(`[INFO] Server running at http://${HOST}:${PORT}`);
    console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[INFO] Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SYSTEM] SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n[SYSTEM] SIGINT signal received: closing HTTP server');
    process.exit(0);
});
