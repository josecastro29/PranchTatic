// Canvas setup
const fieldCanvas = document.getElementById('fieldCanvas');
const drawingCanvas = document.getElementById('drawingCanvas');
const fieldCtx = fieldCanvas.getContext('2d');
const drawingCtx = drawingCanvas.getContext('2d');
const container = document.querySelector('.canvas-container');

// Buttons
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const addRedPlayerBtn = document.getElementById('addRedPlayerBtn');
const addBluePlayerBtn = document.getElementById('addBluePlayerBtn');
const drawBtn = document.getElementById('drawBtn');
const eraserBtn = document.getElementById('eraserBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

// State
let mode = 'redPlayer'; // redPlayer, bluePlayer, draw, erase
let isDrawing = false;
let players = [];
let redPlayerCount = 0;
let bluePlayerCount = 0;
let drawingHistory = [];
let currentPath = [];

// Resize canvases
function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    fieldCanvas.width = rect.width;
    fieldCanvas.height = rect.height;
    drawingCanvas.width = rect.width;
    drawingCanvas.height = rect.height;
    drawField();
    redrawAll();
}

// Draw football field
function drawField() {
    const w = fieldCanvas.width;
    const h = fieldCanvas.height;
    
    fieldCtx.fillStyle = '#2d7a2e';
    fieldCtx.fillRect(0, 0, w, h);
    
    // Field lines
    fieldCtx.strokeStyle = 'white';
    fieldCtx.lineWidth = 2;
    
    // Outer border
    fieldCtx.strokeRect(20, 20, w - 40, h - 40);
    
    // Center line
    fieldCtx.beginPath();
    fieldCtx.moveTo(w / 2, 20);
    fieldCtx.lineTo(w / 2, h - 20);
    fieldCtx.stroke();
    
    // Center circle
    fieldCtx.beginPath();
    fieldCtx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
    fieldCtx.stroke();
    
    // Center dot
    fieldCtx.beginPath();
    fieldCtx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    fieldCtx.fillStyle = 'white';
    fieldCtx.fill();
    
    // Penalty areas
    const penaltyWidth = 120;
    const penaltyHeight = 150;
    
    // Left penalty area
    fieldCtx.strokeRect(20, (h - penaltyHeight) / 2, penaltyWidth, penaltyHeight);
    
    // Right penalty area
    fieldCtx.strokeRect(w - 20 - penaltyWidth, (h - penaltyHeight) / 2, penaltyWidth, penaltyHeight);
    
    // Goal areas
    const goalWidth = 60;
    const goalHeight = 80;
    
    // Left goal area
    fieldCtx.strokeRect(20, (h - goalHeight) / 2, goalWidth, goalHeight);
    
    // Right goal area
    fieldCtx.strokeRect(w - 20 - goalWidth, (h - goalHeight) / 2, goalWidth, goalHeight);
    
    // Penalty spots
    fieldCtx.beginPath();
    fieldCtx.arc(20 + 90, h / 2, 3, 0, Math.PI * 2);
    fieldCtx.fill();
    
    fieldCtx.beginPath();
    fieldCtx.arc(w - 20 - 90, h / 2, 3, 0, Math.PI * 2);
    fieldCtx.fill();
}

// Mode switching
function setMode(newMode) {
    mode = newMode;
    [addRedPlayerBtn, addBluePlayerBtn, drawBtn, eraserBtn].forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'redPlayer') {
        addRedPlayerBtn.classList.add('active');
        drawingCanvas.style.cursor = 'default';
    } else if (mode === 'bluePlayer') {
        addBluePlayerBtn.classList.add('active');
        drawingCanvas.style.cursor = 'default';
    } else if (mode === 'draw') {
        drawBtn.classList.add('active');
        drawingCanvas.style.cursor = 'crosshair';
    } else if (mode === 'erase') {
        eraserBtn.classList.add('active');
        drawingCanvas.style.cursor = 'crosshair';
    }
}

addRedPlayerBtn.addEventListener('click', () => setMode('redPlayer'));
addBluePlayerBtn.addEventListener('click', () => setMode('bluePlayer'));
drawBtn.addEventListener('click', () => setMode('draw'));
eraserBtn.addEventListener('click', () => setMode('erase'));

// Add player
drawingCanvas.addEventListener('click', (e) => {
    if (mode !== 'redPlayer' && mode !== 'bluePlayer') return;
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addPlayerAtPosition(x, y);
});

// Touch support for adding players
drawingCanvas.addEventListener('touchstart', (e) => {
    if (mode !== 'redPlayer' && mode !== 'bluePlayer') return;
    e.preventDefault();
    
    const rect = drawingCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    addPlayerAtPosition(x, y);
});

function addPlayerAtPosition(x, y) {
    let color, number;
    if (mode === 'redPlayer') {
        redPlayerCount++;
        color = '#ff0000';
        number = redPlayerCount;
    } else {
        bluePlayerCount++;
        color = '#0000ff';
        number = bluePlayerCount;
    }
    
    const player = createPlayer(x, y, number, color, mode);
    players.push(player);
    container.appendChild(player.element);
}

function createPlayer(x, y, number, color, team) {
    const div = document.createElement('div');
    div.className = 'player';
    div.textContent = number;
    div.style.left = (x - 20) + 'px';
    div.style.top = (y - 20) + 'px';
    div.style.background = color;
    
    let isDragging = false;
    let offsetX, offsetY;
    
    div.addEventListener('mousedown', (e) => {
        if (mode !== 'redPlayer' && mode !== 'bluePlayer') return;
        isDragging = true;
        offsetX = e.clientX - div.offsetLeft;
        offsetY = e.clientY - div.offsetTop;
        div.style.cursor = 'grabbing';
    });
    
    // Touch support for dragging
    div.addEventListener('touchstart', (e) => {
        if (mode !== 'redPlayer' && mode !== 'bluePlayer') return;
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        offsetX = touch.clientX - rect.left - div.offsetLeft;
        offsetY = touch.clientY - rect.top - div.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        let newX = e.clientX - rect.left - offsetX;
        let newY = e.clientY - rect.top - offsetY;
        
        newX = Math.max(0, Math.min(newX, container.clientWidth - 40));
        newY = Math.max(0, Math.min(newY, container.clientHeight - 40));
        
        div.style.left = newX + 'px';
        div.style.top = newY + 'px';
    });
    
    // Touch support for moving
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        let newX = touch.clientX - rect.left - offsetX;
        let newY = touch.clientY - rect.top - offsetY;
        
        newX = Math.max(0, Math.min(newX, container.clientWidth - 35));
        newY = Math.max(0, Math.min(newY, container.clientHeight - 35));
        
        div.style.left = newX + 'px';
        div.style.top = newY + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        div.style.cursor = 'move';
    });
    
    // Touch support for release
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Double click to remove
    div.addEventListener('dblclick', () => {
        div.remove();
        players = players.filter(p => p.element !== div);
    });
    
    return { element: div, number, team };
}

// Drawing
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
});

function startDrawing(e) {
    if (mode !== 'draw' && mode !== 'erase') return;
    isDrawing = true;
    currentPath = [];
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);
    currentPath.push({ x, y });
}

drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
});

function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    drawingCtx.lineWidth = brushSize.value;
    
    if (mode === 'draw') {
        drawingCtx.globalCompositeOperation = 'source-over';
        drawingCtx.strokeStyle = colorPicker.value;
    } else if (mode === 'erase') {
        drawingCtx.globalCompositeOperation = 'destination-out';
        drawingCtx.lineWidth = brushSize.value * 3;
    }
    
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    
    currentPath.push({ x, y });
}

drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('touchend', stopDrawing);

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentPath.length > 0) {
        drawingHistory.push({
            path: [...currentPath],
            color: colorPicker.value,
            size: brushSize.value,
            mode: mode
        });
    }
}

// Redraw all paths
function redrawAll() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    drawingHistory.forEach(item => {
        if (item.path.length === 0) return;
        
        drawingCtx.beginPath();
        drawingCtx.moveTo(item.path[0].x, item.path[0].y);
        
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        
        if (item.mode === 'draw') {
            drawingCtx.globalCompositeOperation = 'source-over';
            drawingCtx.strokeStyle = item.color;
            drawingCtx.lineWidth = item.size;
        } else if (item.mode === 'erase') {
            drawingCtx.globalCompositeOperation = 'destination-out';
            drawingCtx.lineWidth = item.size * 3;
        }
        
        for (let i = 1; i < item.path.length; i++) {
            drawingCtx.lineTo(item.path[i].x, item.path[i].y);
        }
        
        drawingCtx.stroke();
    });
    
    drawingCtx.globalCompositeOperation = 'source-over';
}

// Clear all
clearBtn.addEventListener('click', () => {
    if (confirm('Limpar tudo?')) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingHistory = [];
        players.forEach(p => p.element.remove());
        players = [];
        redPlayerCount = 0;
        bluePlayerCount = 0;
    }
});

// Undo
undoBtn.addEventListener('click', () => {
    if (drawingHistory.length > 0) {
        drawingHistory.pop();
        redrawAll();
    }
});

// Initialize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
