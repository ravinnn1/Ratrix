// Default values
const defaults = {
    supply: 1000000000,
    liquidity: 50000,
    holders: 500,
    devWallet: 10
};

// Get all input elements
const supplyInput = document.getElementById('supply');
const liquidityInput = document.getElementById('liquidity');
const holdersInput = document.getElementById('holders');
const devWalletInput = document.getElementById('devWallet');

// Get score display elements
const scoreNumber = document.getElementById('scoreNumber');
const gaugeFill = document.getElementById('gaugeFill');
const riskLevel = document.getElementById('riskLevel');
const riskPersona = document.getElementById('riskPersona');

// Get breakdown elements
const liquidityRisk = document.getElementById('liquidityRisk');
const liquidityRiskValue = document.getElementById('liquidityRiskValue');
const holderRisk = document.getElementById('holderRisk');
const holderRiskValue = document.getElementById('holderRiskValue');
const devRisk = document.getElementById('devRisk');
const devRiskValue = document.getElementById('devRiskValue');
const supplyRisk = document.getElementById('supplyRisk');
const supplyRiskValue = document.getElementById('supplyRiskValue');

// Progress bars
const supplyProgress = document.getElementById('supplyProgress');
const liquidityProgress = document.getElementById('liquidityProgress');
const holdersProgress = document.getElementById('holdersProgress');
const devWalletProgress = document.getElementById('devWalletProgress');

// Console and terminal
const consoleOutput = document.getElementById('consoleOutput');
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');

// History
const historyList = document.getElementById('historyList');
let riskHistory = [];

// Terminal history
let commandHistory = [];
let historyIndex = -1;

// Sound effect
const clickSound = document.getElementById('clickSound');
let soundEnabled = true;
let lastSimulatedScore = 0;

// Bootup Animation
window.addEventListener('DOMContentLoaded', () => {
    const bootupScreen = document.getElementById('bootup');
    const mainContent = document.getElementById('mainContent');
    
    setTimeout(() => {
        bootupScreen.style.transition = 'opacity 0.5s ease-out';
        bootupScreen.style.opacity = '0';
        
        setTimeout(() => {
            bootupScreen.style.display = 'none';
            mainContent.style.display = 'block';
            mainContent.style.opacity = '0';
            
            setTimeout(() => {
                mainContent.style.transition = 'opacity 0.6s ease-in';
                mainContent.style.opacity = '1';
            }, 50);
        }, 500);
    }, 2500);
});

// Play click sound
function playClickSound() {
    if (soundEnabled && clickSound) {
        clickSound.currentTime = 0;
        clickSound.volume = 0.2;
        clickSound.play().catch(() => {});
    }
}

// Play command success sound (optional)
function playCommandSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context is not supported
    }
}

// Limit terminal to 8 visible lines
function limitTerminalLines() {
    const lines = Array.from(terminalOutput.querySelectorAll('.terminal-line'));
    while (lines.length > 8) {
        terminalOutput.removeChild(lines.shift());
    }
}

// Add blinking cursor to terminal
function addTerminalCursor() {
    // Remove existing cursor if any
    const existingCursors = terminalOutput.querySelectorAll('.terminal-cursor');
    existingCursors.forEach(cursor => cursor.remove());
    
    // Add new cursor to last line
    const lines = terminalOutput.querySelectorAll('.terminal-line');
    if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        lastLine.appendChild(cursor);
    }
}

// Terminal typing animation with character-by-character output
async function typeText(text, color = '#8fff00', prefix = '') {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.style.color = color;
    terminalOutput.appendChild(line);
    
    // Type prefix instantly if exists
    if (prefix) {
        line.textContent = prefix + ' ';
    }
    
    // Type each character with delay
    for (let char of text) {
        line.textContent += char;
        await new Promise(resolve => setTimeout(resolve, 15));
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
    
    limitTerminalLines();
    addTerminalCursor();
}

// Add instant terminal line (for non-typed output)
function addTerminalLine(text, color = '#8fff00', prefix = '') {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.style.color = color;
    line.textContent = prefix ? `${prefix} ${text}` : text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    
    limitTerminalLines();
    addTerminalCursor();
}

// Add console log
function addConsoleLog(message, type = 'INFO') {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = `[${type}] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Add cursor to console too
    const existingCursors = consoleOutput.querySelectorAll('.terminal-cursor');
    existingCursors.forEach(cursor => cursor.remove());
    
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    line.appendChild(cursor);
    
    while (consoleOutput.children.length > 20) {
        consoleOutput.removeChild(consoleOutput.firstChild);
    }
}

// Parse input value
function parseInputValue(value, min = 0, max = Infinity) {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return min;
    return Math.max(min, Math.min(max, numValue));
}

// Update progress bars
function updateProgressBars() {
    const supply = parseInputValue(supplyInput.value, 1000000, 100000000000);
    const liquidity = parseInputValue(liquidityInput.value, 1000, 1000000);
    const holders = parseInputValue(holdersInput.value, 10, 10000);
    const devWallet = parseInputValue(devWalletInput.value, 0, 100);
    
    supplyProgress.style.width = ((supply / 100000000000) * 100) + '%';
    liquidityProgress.style.width = ((liquidity / 1000000) * 100) + '%';
    holdersProgress.style.width = ((holders / 10000) * 100) + '%';
    devWalletProgress.style.width = devWallet + '%';
}

// Calculate risk scores
function calculateLiquidityRisk(liquidity) {
    if (liquidity < 10000) return 90 - (liquidity / 10000) * 40;
    else if (liquidity < 100000) return 50 - ((liquidity - 10000) / 90000) * 30;
    else if (liquidity < 500000) return 20 - ((liquidity - 100000) / 400000) * 15;
    else return Math.max(0, 5 - ((liquidity - 500000) / 500000) * 5);
}

function calculateHolderRisk(holders) {
    if (holders < 50) return 95 - (holders / 50) * 25;
    else if (holders < 500) return 70 - ((holders - 50) / 450) * 40;
    else if (holders < 2000) return 30 - ((holders - 500) / 1500) * 20;
    else return Math.max(0, 10 - ((holders - 2000) / 8000) * 10);
}

function calculateDevWalletRisk(devPercent) {
    if (devPercent <= 5) return devPercent * 2;
    else if (devPercent <= 15) return 10 + (devPercent - 5) * 3;
    else if (devPercent <= 30) return 40 + (devPercent - 15) * 2.5;
    else if (devPercent < 100) return 77.5 + (devPercent - 30) * 0.321;
    else return 100;
}

function calculateSupplyRisk(supply, holders) {
    const avgPerHolder = supply / holders;
    const concentrationRatio = Math.log10(avgPerHolder) / Math.log10(supply);
    if (concentrationRatio > 0.8) return 80 + (concentrationRatio - 0.8) * 100;
    else if (concentrationRatio > 0.5) return 40 + (concentrationRatio - 0.5) * 133;
    else return concentrationRatio * 80;
}

function calculateRiskScore() {
    const supply = parseInputValue(supplyInput.value, 1000, 100000000000);
    const liquidity = parseInputValue(liquidityInput.value, 1, 10000000);
    const holders = parseInputValue(holdersInput.value, 1, 100000);
    const devWallet = parseInputValue(devWalletInput.value, 0, 100);
    
    const liqRisk = calculateLiquidityRisk(liquidity);
    const holdRisk = calculateHolderRisk(holders);
    const devRisk = calculateDevWalletRisk(devWallet);
    const suppRisk = calculateSupplyRisk(supply, holders);
    
    let totalRisk;
    if (devWallet === 100) {
        totalRisk = 100;
    } else {
        totalRisk = (liqRisk * 0.35 + holdRisk * 0.25 + devRisk * 0.30 + suppRisk * 0.10);
    }
    
    return {
        total: Math.round(totalRisk),
        liquidity: Math.round(liqRisk),
        holders: Math.round(holdRisk),
        dev: Math.round(devRisk),
        supply: Math.round(suppRisk)
    };
}

// Update gauge
function updateGauge(score) {
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (score / 100) * circumference;
    gaugeFill.style.strokeDashoffset = offset;
    
    if (score <= 25) gaugeFill.style.stroke = '#10b981';
    else if (score <= 50) gaugeFill.style.stroke = '#f59e0b';
    else if (score <= 75) gaugeFill.style.stroke = '#ef4444';
    else gaugeFill.style.stroke = '#ff4444';
}

// Get risk level
function getRiskLevel(score) {
    if (score <= 25) return { text: 'LOW RISK ✓', class: 'low' };
    else if (score <= 50) return { text: 'MODERATE RISK ⚠', class: 'moderate' };
    else if (score <= 75) return { text: 'HIGH RISK ⚠⚠', class: 'high' };
    else return { text: 'CRITICAL RISK ⛔', class: 'critical' };
}

// Get risk persona
function getRiskPersona(score) {
    if (score <= 20) return '[+] Cautious Whale';
    else if (score <= 40) return '[=] Balanced Ape';
    else if (score <= 60) return '[~] Risky Degen';
    else if (score <= 80) return '[!] Overleveraged Degen';
    else return '[X] Absolute Madlad';
}

// Add to history
function addToHistory(score) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    riskHistory.unshift({ timestamp, score });
    if (riskHistory.length > 10) riskHistory.pop();
    
    historyList.innerHTML = '';
    riskHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `<span class="timestamp">${item.timestamp}</span><span class="score">${item.score}</span>`;
        historyList.appendChild(historyItem);
    });
}

// Update display
function updateDisplay() {
    const scores = calculateRiskScore();
    lastSimulatedScore = scores.total;
    
    scoreNumber.textContent = scores.total;
    updateGauge(scores.total);
    updateScaleIndicator(scores.total);
    
    const levelInfo = getRiskLevel(scores.total);
    riskLevel.textContent = levelInfo.text;
    riskLevel.className = 'risk-level ' + levelInfo.class;
    
    riskPersona.textContent = getRiskPersona(scores.total);
    riskPersona.style.opacity = '0';
    setTimeout(() => riskPersona.style.opacity = '1', 100);
    
    updateBreakdownBar(liquidityRisk, liquidityRiskValue, scores.liquidity);
    updateBreakdownBar(holderRisk, holderRiskValue, scores.holders);
    updateBreakdownBar(devRisk, devRiskValue, scores.dev);
    updateBreakdownBar(supplyRisk, supplyRiskValue, scores.supply);
    
    updateProgressBars();
    addToHistory(scores.total);
    
    if (scores.liquidity > 60) addConsoleLog('Liquidity ratio below threshold', 'WARN');
    if (scores.dev > 50) addConsoleLog('Dev wallet concentration risky', 'WARN');
    if (scores.holders > 70) addConsoleLog('Holder distribution concerning', 'INFO');
}

// Update scale indicator position
function updateScaleIndicator(score) {
    const scaleIndicator = document.getElementById('scaleIndicator');
    if (scaleIndicator) {
        const position = score;
        scaleIndicator.style.bottom = `calc(${position}% - 1.5px)`;
    }
}

// Update breakdown bar
function updateBreakdownBar(barElement, valueElement, score) {
    barElement.style.width = score + '%';
    valueElement.textContent = score;
}

// Reset values
function resetValues() {
    playClickSound();
    supplyInput.value = defaults.supply;
    liquidityInput.value = defaults.liquidity;
    holdersInput.value = defaults.holders;
    devWalletInput.value = defaults.devWallet;
    updateDisplay();
    addConsoleLog('Reset to default values', 'SYSTEM');
}

// Run audit
function runAudit() {
    playClickSound();
    const auditReport = document.getElementById('auditReport');
    const auditLine1 = document.getElementById('auditLine1');
    const auditLine2 = document.getElementById('auditLine2');
    const auditLine3 = document.getElementById('auditLine3');
    
    auditReport.style.display = 'block';
    
    const scores = calculateRiskScore();
    const isVerified = Math.random() > 0.3;
    const holderDiversity = scores.holders < 30 ? 'Good' : scores.holders < 60 ? 'Moderate' : 'Poor';
    const rugProb = scores.total;
    
    setTimeout(() => {
        auditLine1.textContent = `Contract Verified: ${isVerified}`;
        auditLine1.style.opacity = '1';
    }, 300);
    
    setTimeout(() => {
        auditLine2.textContent = `Holder Diversity: ${holderDiversity}`;
        auditLine2.style.opacity = '1';
    }, 900);
    
    setTimeout(() => {
        auditLine3.textContent = `Rug Probability: ${rugProb}%`;
        auditLine3.style.opacity = '1';
    }, 1500);
    
    addConsoleLog('Audit report generated', 'SYSTEM');
}

// Simulate rug
function simulateRug() {
    playClickSound();
    const rugScreen = document.getElementById('rugScreen');
    rugScreen.style.display = 'flex';
    
    setTimeout(() => {
        rugScreen.style.display = 'none';
        location.reload();
    }, 3000);
    
    addConsoleLog('RUGPULL DETECTED', 'ERROR');
}

// Matrix rain animation
function matrixRain() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9998';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = '01';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    let frameCount = 0;
    const maxFrames = 300;
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#8fff00';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        
        frameCount++;
        if (frameCount < maxFrames) {
            requestAnimationFrame(draw);
        } else {
            document.body.removeChild(canvas);
        }
    }
    
    draw();
}

// Terminal commands
const terminalCommands = {
    help: async () => {
        await typeText('Available commands:', '#00ffff', '[INFO]');
        await typeText('simulate, audit, clear, stats, score', '#8fff00');
        playCommandSound();
    },
    
    simulate: async () => {
        await typeText('Running node analysis...', '#00ffff', '[INFO]');
        await new Promise(r => setTimeout(r, 1000));
        await typeText('Analyzing liquidity fractals...', '#00ffff', '[INFO]');
        await new Promise(r => setTimeout(r, 1000));
        const score = Math.floor(Math.random() * 100);
        lastSimulatedScore = score;
        await typeText(`Risk Score: ${score}`, '#22c55e', '[SUCCESS]');
        const evaluation = score < 30 ? 'low risk — safe to proceed' : 
                          score < 60 ? 'moderate risk — proceed with caution' :
                          'high risk — exit recommended';
        await typeText(evaluation, '#facc15', '[WARN]');
        playCommandSound();
    },
    
    audit: async () => {
        await typeText('Initiating smart contract audit...', '#00ffff', '[INFO]');
        await new Promise(r => setTimeout(r, 800));
        await typeText('3 functions unverified', '#facc15', '[WARN]');
        await new Promise(r => setTimeout(r, 600));
        await typeText('LP tokens locked 1 year', '#22c55e', '[PASS]');
        await new Promise(r => setTimeout(r, 600));
        await typeText('Audit complete', '#00ffff', '[INFO]');
        playCommandSound();
    },
    
    clear: () => {
        terminalOutput.innerHTML = '';
        addTerminalLine('Terminal cleared');
        addTerminalLine('Type \'help\' for available commands');
    },
    
    stats: async () => {
        await typeText('System Usage Dashboard', '#00ffff', '[INFO]');
        await typeText('CPU:     ███▒▒▒▒▒▒▒ 32%', '#8fff00');
        await typeText('Memory:  █████▒▒▒▒▒ 51%', '#8fff00');
        await typeText('Network: ████▒▒▒▒▒▒ 45%', '#8fff00');
        await typeText('Storage: ██▒▒▒▒▒▒▒▒ 18%', '#8fff00');
        playCommandSound();
    },
    
    matrix: async () => {
        await typeText('Initiating matrix protocol...', '#22c55e', '[SUCCESS]');
        matrixRain();
        playCommandSound();
    },
    
    score: async () => {
        const evaluation = lastSimulatedScore < 30 ? 'low risk — safe to proceed' : 
                          lastSimulatedScore < 60 ? 'moderate risk — proceed with caution' :
                          'high risk — exit recommended';
        await typeText(`Last score: ${lastSimulatedScore}`, '#8fff00');
        await typeText(evaluation, '#facc15');
        playCommandSound();
    }
};

// Handle terminal input
terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            terminalInput.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = -1;
            terminalInput.value = '';
        }
    }
});

terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        
        if (command) {
            commandHistory.unshift(command);
            if (commandHistory.length > 50) commandHistory.pop();
            historyIndex = -1;
            
            addTerminalLine(`> ${command}`, '#8fff00');
            
            if (terminalCommands[command]) {
                await terminalCommands[command]();
            } else {
                await typeText(`Command not found: ${command}`, '#ef4444', '[ERROR]');
                await typeText('Type \'help\' for available commands', '#00ffff', '[INFO]');
            }
        }
    }
});

// Event listeners  
let updateTimeout;
function debouncedUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateDisplay, 50);
}

supplyInput.addEventListener('input', debouncedUpdate);
liquidityInput.addEventListener('input', debouncedUpdate);
holdersInput.addEventListener('input', debouncedUpdate);
devWalletInput.addEventListener('input', debouncedUpdate);

[supplyInput, liquidityInput, holdersInput, devWalletInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playClickSound();
            clearTimeout(updateTimeout);
            updateDisplay();
        }
    });
    input.addEventListener('focus', playClickSound);
});

// Generate PDF Report
async function generateReport() {
    playClickSound();
    
    // Show confirmation dialog
    const confirmed = confirm(
        '⚠️ REPORT GENERATION\n\n' +
        'This will download a PDF containing:\n' +
        '• Current risk score and assessment\n' +
        '• All project variables\n' +
        '• Risk breakdown analysis\n' +
        '• QR code with encoded data\n\n' +
        'Continue with PDF download?'
    );
    
    if (!confirmed) {
        addConsoleLog('Report generation cancelled', 'INFO');
        return;
    }
    
    // Add console logs
    addConsoleLog('Initiating report generation...', 'INFO');
    await new Promise(r => setTimeout(r, 500));
    addConsoleLog('Capturing dashboard data...', 'INFO');
    await new Promise(r => setTimeout(r, 500));
    addConsoleLog('Generating QR code...', 'INFO');
    await new Promise(r => setTimeout(r, 500));
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current data
        const scores = calculateRiskScore();
        const supply = parseInputValue(supplyInput.value, 1000, 100000000000);
        const liquidity = parseInputValue(liquidityInput.value, 1, 10000000);
        const holders = parseInputValue(holdersInput.value, 1, 100000);
        const devWallet = parseInputValue(devWalletInput.value, 0, 100);
        const levelInfo = getRiskLevel(scores.total);
        
        // QR code links to special URL
        const reportData = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        
        // Set background to black
        doc.setFillColor(12, 12, 12);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Header
        doc.setTextColor(143, 255, 0);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('[#] Ratrix', 20, 25);
        
        doc.setFontSize(20);
        doc.text('Audit Report', 20, 35);
        
        // Add neon green line
        doc.setDrawColor(143, 255, 0);
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);
        
        // Risk Score (Large)
        doc.setFontSize(60);
        const scoreColor = scores.total <= 25 ? [16, 185, 129] : 
                          scores.total <= 50 ? [245, 158, 11] :
                          scores.total <= 75 ? [239, 68, 68] : [255, 68, 68];
        doc.setTextColor(...scoreColor);
        doc.text(scores.total.toString(), 105, 80, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(143, 255, 0);
        doc.text('RISK SCORE', 105, 90, { align: 'center' });
        
        // Risk Level Label (clean & trim)
        doc.setFontSize(16);
        doc.setTextColor(...scoreColor);
        const cleanRiskLabel = (levelInfo.text || "").replace(/[^A-Z\s]/gi, "").trim();
        doc.text(cleanRiskLabel.toUpperCase(), 105, 105, { align: 'center' });
        
        // Add divider
        doc.setDrawColor(143, 255, 0);
        doc.line(20, 115, 190, 115);
        
        // Audit Engine Version
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('Audit Engine v1.0', 105, 48, { align: 'center' });
        
        // Project Variables
        doc.setFontSize(14);
        doc.setTextColor(143, 255, 0);
        doc.text('Project Variables', 20, 130);
        
        doc.setFontSize(10);
        doc.setTextColor(229, 229, 229);
        doc.text(`Total Supply: ${supply.toLocaleString()}`, 25, 140);
        doc.text(`Liquidity (USD): $${liquidity.toLocaleString()}`, 25, 148);
        doc.text(`Number of Holders: ${holders.toLocaleString()}`, 25, 156);
        doc.text(`Dev Wallet %: ${devWallet}%`, 25, 164);
        
        // Add divider
        doc.setDrawColor(143, 255, 0);
        doc.line(20, 172, 190, 172);
        
        // Risk Breakdown
        doc.setFontSize(14);
        doc.setTextColor(143, 255, 0);
        doc.text('Risk Breakdown', 20, 185);
        
        doc.setFontSize(10);
        const breakdowns = [
            { label: 'Liquidity Risk', value: scores.liquidity, y: 195 },
            { label: 'Holder Distribution', value: scores.holders, y: 210 },
            { label: 'Dev Wallet Risk', value: scores.dev, y: 225 },
            { label: 'Supply Concentration', value: scores.supply, y: 240 }
        ];
        
        breakdowns.forEach(item => {
            doc.setTextColor(156, 163, 175);
            doc.text(item.label, 25, item.y);
            
            // Draw bar
            const barWidth = (item.value / 100) * 150;
            doc.setFillColor(143, 255, 0);
            doc.rect(25, item.y + 2, barWidth, 5, 'F');
            
            // Draw border
            doc.setDrawColor(143, 255, 0);
            doc.rect(25, item.y + 2, 150, 5);
            
            // Value
            doc.setTextColor(143, 255, 0);
            doc.text(item.value.toString(), 180, item.y);
        });
        
        // QR Code section
        addConsoleLog('Encoding report data...', 'INFO');
        await new Promise(r => setTimeout(r, 300));
        
        // Create QR code as Data URL
        const qrContainer = document.createElement('div');
        qrContainer.style.display = 'none';
        document.body.appendChild(qrContainer);
        
        const qrCode = new QRCode(qrContainer, {
            text: reportData,
            width: 100,
            height: 100,
            colorDark: '#8fff00',
            colorLight: '#0c0c0c'
        });
        
        // Wait for QR code to generate
        await new Promise(r => setTimeout(r, 500));
        
        const qrImage = qrContainer.querySelector('img');
        const qrY = 248;
        const qrSize = 25;
        
        if (qrImage) {
            // Add dark background box behind QR code
            doc.setFillColor(0, 0, 0);
            doc.rect(87.5, qrY, 30, 30, 'F');
            
            // Add QR code
            doc.addImage(qrImage.src, 'PNG', 90, qrY + 2.5, qrSize, qrSize);
        }
        
        document.body.removeChild(qrContainer);
        
        // Legal Disclaimer
        doc.setFontSize(5.5);
        doc.setTextColor(100, 100, 100);
        doc.text('LEGAL DISCLAIMER: This audit is for entertainment purposes only and does not', 105, 280, { align: 'center' });
        doc.text('constitute financial advice. Always conduct your own research.', 105, 284, { align: 'center' });
        
        // Footer - timestamp
        doc.setFontSize(4.5);
        doc.setTextColor(70, 70, 70);
        const timestamp = new Date().toLocaleString();
        doc.text(`Generated: ${timestamp}`, 105, 290, { align: 'center' });
        
        // Add border
        doc.setDrawColor(143, 255, 0);
        doc.setLineWidth(1);
        doc.rect(10, 10, 190, 277);
        
        addConsoleLog('Report generated successfully', 'SUCCESS');
        
        // Download PDF
        doc.save('Ratrix_Audit_Report.pdf');
        addConsoleLog('PDF downloaded', 'SUCCESS');
        
    } catch (error) {
        console.error('Report generation error:', error);
        addConsoleLog('Report generation failed', 'ERROR');
        addConsoleLog(error.message, 'ERROR');
    }
}

// Header Enhancements
let simulationsCount = Math.floor(Math.random() * 50000) + 10000;
let systemUptime = 0;

function updateUTCClock() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('utcClock');
    if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds} UTC`;
}

function updateUptime() {
    systemUptime++;
    const hours = Math.floor(systemUptime / 3600);
    const minutes = Math.floor((systemUptime % 3600) / 60);
    const seconds = systemUptime % 60;
    const uptimeEl = document.getElementById('uptimeValue');
    if (uptimeEl) {
        uptimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function incrementSimulations() {
    const increment = Math.floor(Math.random() * 5) + 1;
    simulationsCount += increment;
    const countEl = document.getElementById('simulationsCount');
    if (countEl) countEl.textContent = simulationsCount.toLocaleString();
}

function updateNodes() {
    const nodes = 420 + Math.floor(Math.random() * 50);
    const nodesEl = document.getElementById('nodesValue');
    if (nodesEl) nodesEl.textContent = nodes;
}

function updateSync() {
    const sync = 97 + Math.floor(Math.random() * 3);
    const syncEl = document.getElementById('syncValue');
    if (syncEl) syncEl.textContent = `${sync}%`;
}

function initializeHeaderAnimations() {
    const countEl = document.getElementById('simulationsCount');
    if (countEl) countEl.textContent = simulationsCount.toLocaleString();
    updateUTCClock();
    updateUptime();
    updateNodes();
    updateSync();
    
    setInterval(updateUTCClock, 1000);
    setInterval(updateUptime, 1000);
    setInterval(incrementSimulations, 30000);
    setInterval(updateNodes, 3000);
    setInterval(updateSync, 5000);
}

// CoinGecko API Integration (browser-friendly, no API key needed)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets';

// Calculate risk score for a cryptocurrency based on market data
function calculateCryptoRiskScore(coin) {
    let riskScore = 0;
    
    // Market cap risk (lower market cap = higher risk)
    const marketCap = coin.market_cap;
    if (marketCap < 10000000) riskScore += 30;
    else if (marketCap < 100000000) riskScore += 20;
    else if (marketCap < 1000000000) riskScore += 10;
    else riskScore += 5;
    
    // Volume to market cap ratio risk
    const volume24h = coin.total_volume;
    const volumeRatio = volume24h / marketCap;
    if (volumeRatio > 0.5) riskScore += 25; // High volatility
    else if (volumeRatio > 0.2) riskScore += 15;
    else if (volumeRatio > 0.1) riskScore += 10;
    else riskScore += 5;
    
    // Price change volatility risk
    const percentChange24h = Math.abs(coin.price_change_percentage_24h || 0);
    if (percentChange24h > 20) riskScore += 25;
    else if (percentChange24h > 10) riskScore += 15;
    else if (percentChange24h > 5) riskScore += 10;
    else riskScore += 5;
    
    // Circulating supply risk (if available)
    const circulatingSupply = coin.circulating_supply;
    const maxSupply = coin.max_supply;
    if (maxSupply && circulatingSupply) {
        const supplyRatio = circulatingSupply / maxSupply;
        if (supplyRatio < 0.5) riskScore += 15; // High inflation risk
        else if (supplyRatio < 0.8) riskScore += 10;
        else riskScore += 5;
    } else {
        riskScore += 10; // Unknown max supply is risky
    }
    
    return Math.min(100, Math.round(riskScore));
}

// Fetch top traded coins from CoinGecko
async function fetchTopTradedCoins() {
    try {
        addConsoleLog('Fetching top traded coins...', 'INFO');
        
        // CoinGecko API - get top coins by trading volume
        const response = await fetch(
            `${COINGECKO_API_URL}?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            updateLeaderboard(data.slice(0, 4)); // Top 4 coins
            addConsoleLog('Leaderboard updated with live data', 'SUCCESS');
        }
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        addConsoleLog(`API fetch failed: ${error.message}`, 'WARN');
        // Keep the static fallback data if API fails
    }
}

// Update leaderboard with live data
function updateLeaderboard(coins) {
    const leaderboardTable = document.querySelector('.leaderboard-table');
    if (!leaderboardTable) return;
    
    // Keep the header row
    const headerRow = leaderboardTable.querySelector('.leaderboard-row.header');
    
    // Clear existing rows except header
    leaderboardTable.innerHTML = '';
    leaderboardTable.appendChild(headerRow);
    
    // Add new rows with live data
    coins.forEach((coin, index) => {
        const riskScore = calculateCryptoRiskScore(coin);
        const price = coin.current_price;
        const priceFormatted = price >= 1 
            ? `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
            : `$${price.toFixed(6)}`;
        
        // Determine risk class
        let riskClass = 'low';
        if (riskScore > 75) riskClass = 'critical';
        else if (riskScore > 50) riskClass = 'high';
        else if (riskScore > 25) riskClass = 'moderate';
        
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="token">${coin.symbol.toUpperCase()}</span>
            <span class="price">${priceFormatted}</span>
            <span class="risk-score ${riskClass}">${riskScore}</span>
        `;
        
        leaderboardTable.appendChild(row);
    });
}

// Compact Mode Toggle
let compactMode = false;

function toggleCompactMode() {
    compactMode = !compactMode;
    const body = document.body;
    const hints = document.querySelectorAll('.input-hint');
    const labels = document.querySelectorAll('.label-text');
    
    if (compactMode) {
        body.classList.add('compact-mode');
        hints.forEach(hint => hint.style.display = 'none');
        addConsoleLog('Compact mode enabled', 'INFO');
    } else {
        body.classList.remove('compact-mode');
        hints.forEach(hint => hint.style.display = 'block');
        addConsoleLog('Compact mode disabled', 'INFO');
    }
}

// Initialize after bootup
setTimeout(() => {
    updateDisplay();
    addConsoleLog('System ready for analysis', 'INFO');
    initializeHeaderAnimations();
    
    // Fetch top traded coins on load
    fetchTopTradedCoins();
    
    // Update leaderboard every 5 minutes
    setInterval(fetchTopTradedCoins, 300000);
}, 3000);
