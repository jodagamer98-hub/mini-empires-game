// Game Constants
const GAME_CONFIG = {
    MAP_SIZE: 25,
    HEX_RADIUS: 30,
    MAX_PLAYERS: 30,
    STARTING_GOLD: 600,
    STARTING_OIL: 0,
    STARTING_POP: 10,
    GAME_SPEED: 1
};

// Tile Types
const TILE_TYPES = {
    GRASS: { name: 'grass', color: '#2ecc71', resource: null },
    FOREST: { name: 'forest', color: '#27ae60', resource: null },
    MOUNTAIN: { name: 'mountain', color: '#7f8c8d', resource: null },
    WATER: { name: 'water', color: '#3498db', resource: null },
    GOLD_MINE: { name: 'gold_mine', color: '#f39c12', resource: 'gold' },
    OIL_WELL: { name: 'oil_well', color: '#34495e', resource: 'oil' }
};

// Building Types
const BUILDINGS = {
    CORE: { name: 'Core', cost: 0, gold: 0, oil: 0, pop: 5, time: 0 },
    FARM: { name: 'Farm', cost: 50, gold: 2, oil: 0, pop: 2, time: 5 },
    BARRACKS: { name: 'Barracks', cost: 100, gold: 0, oil: 0, pop: 3, time: 10 },
    FACTORY: { name: 'Factory', cost: 150, gold: 1, oil: 2, pop: 4, time: 15 },
    TOWER: { name: 'Tower', cost: 200, gold: 0, oil: 0, pop: 2, time: 8 }
};

// Unit Types
const UNITS = {
    BUILDER: { name: 'Builder', cost: 25, attack: 0, defense: 0, speed: 2 },
    SOLDIER: { name: 'Soldier', cost: 50, attack: 5, defense: 3, speed: 2 },
    ARCHER: { name: 'Archer', cost: 60, attack: 7, defense: 2, speed: 2 },
    KNIGHT: { name: 'Knight', cost: 100, attack: 10, defense: 8, speed: 1 }
};

// Game State
let gameState = {
    player: null,
    map: [],
    tiles: new Map(),
    gameTime: 0,
    selectedTile: null,
    gameRunning: false,
    players: new Map()
};

// Initialize Game
function initGame() {
    console.log('Initializing game...');
    
    // Generate map
    gameState.map = generateHexMap(GAME_CONFIG.MAP_SIZE);
    
    // Create player
    gameState.player = {
        id: 'player_' + Date.now(),
        name: 'Player',
        gold: GAME_CONFIG.STARTING_GOLD,
        oil: GAME_CONFIG.STARTING_OIL,
        population: GAME_CONFIG.STARTING_POP,
        tiles: [],
        buildings: new Map(),
        units: new Map()
    };
    
    // Assign starting tile
    let startTile = gameState.map[Math.floor(Math.random() * gameState.map.length)];
    while (startTile.owner) {
        startTile = gameState.map[Math.floor(Math.random() * gameState.map.length)];
    }
    
    startTile.owner = gameState.player.id;
    startTile.building = BUILDINGS.CORE;
    gameState.player.tiles.push(startTile);
    gameState.player.buildings.set(getTileKey(startTile), { type: 'CORE', buildTime: 0 });
    
    // Add starting units
    gameState.player.units.set('builder_1', { type: 'BUILDER', tile: startTile });
    gameState.player.units.set('builder_2', { type: 'BUILDER', tile: startTile });
    
    gameState.gameRunning = true;
    
    // Start game loop
    gameLoop();
}

// Generate Hexagonal Map
function generateHexMap(size) {
    const tiles = [];
    const tileTypes = Object.values(TILE_TYPES);
    
    for (let q = 0; q < size; q++) {
        for (let r = 0; r < size; r++) {
            const randomType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
            
            tiles.push({
                q: q,
                r: r,
                type: randomType,
                owner: null,
                building: null,
                units: [],
                hp: 100,
                lastProduction: 0
            });
        }
    }
    
    return tiles;
}

// Hex to Pixel Conversion
function hexToPixel(q, r, centerX, centerY) {
    const size = GAME_CONFIG.HEX_RADIUS;
    const x = centerX + size * (3/2 * q);
    const y = centerY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
}

// Draw Game
function drawGame(canvas, ctx) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Clear canvas
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    gameState.map.forEach(tile => {
        const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY);
        drawHex(ctx, x, y, GAME_CONFIG.HEX_RADIUS, tile);
    });
    
    // Draw UI
    updateUI();
}

// Draw Single Hex
function drawHex(ctx, centerX, centerY, radius, tile) {
    ctx.beginPath();
    
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    
    // Fill tile
    ctx.fillStyle = tile.type.color;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = tile.owner ? '#ff6b6b' : '#999';
    ctx.lineWidth = tile.owner === gameState.player.id ? 3 : 1;
    ctx.stroke();
    
    // Draw building if exists
    if (tile.building) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.building.name.substring(0, 1), centerX, centerY);
    }
}

// Handle Tile Click
function handleTileClick(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Find clicked tile
    for (let tile of gameState.map) {
        const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        
        if (distance < GAME_CONFIG.HEX_RADIUS) {
            gameState.selectedTile = tile;
            updateTileInfo(tile);
            return;
        }
    }
}

// Update Tile Info Panel
function updateTileInfo(tile) {
    const tileInfoDiv = document.getElementById('tileInfo');
    const actionsDiv = document.getElementById('actions');
    
    let info = `<strong>${tile.type.name.toUpperCase()}</strong><br>`;
    if (tile.owner === gameState.player.id) {
        info += 'Your territory';
        if (tile.building) {
            info += ` - ${tile.building.name}`;
        }
    } else if (tile.owner) {
        info += 'Enemy territory';
    } else {
        info += 'Neutral - Click to expand';
    }
    
    tileInfoDiv.innerHTML = info;
    
    // Update action buttons
    actionsDiv.innerHTML = '';
    
    if (tile.owner === gameState.player.id) {
        // Show building options
        Object.entries(BUILDINGS).forEach(([key, building]) => {
            if (key !== 'CORE' && !tile.building) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-small btn-secondary';
                btn.textContent = `${building.name} (${building.cost}g)`;
                btn.onclick = () => buildBuilding(tile, key);
                actionsDiv.appendChild(btn);
            }
        });
        
        // Recruit units
        Object.entries(UNITS).forEach(([key, unit]) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-small btn-primary';
            btn.textContent = `Recruit ${unit.name} (${unit.cost}g)`;
            btn.onclick = () => recruitUnit(tile, key);
            actionsDiv.appendChild(btn);
        });
    } else if (!tile.owner) {
        // Expand to neutral tile
        const btn = document.createElement('button');
        btn.className = 'btn btn-small btn-primary';
        btn.textContent = 'Expand (50g)';
        btn.onclick = () => expandTerritory(tile);
        actionsDiv.appendChild(btn);
    } else {
        // Attack enemy
        const btn = document.createElement('button');
        btn.className = 'btn btn-small btn-primary';
        btn.textContent = 'Attack!';
        btn.onclick = () => attackTile(tile);
        actionsDiv.appendChild(btn);
    }
}

// Build Building
function buildBuilding(tile, buildingType) {
    const building = BUILDINGS[buildingType];
    
    if (gameState.player.gold < building.cost) {
        alert('Not enough gold!');
        return;
    }
    
    gameState.player.gold -= building.cost;
    tile.building = building;
    gameState.player.buildings.set(getTileKey(tile), { type: buildingType, buildTime: building.time });
    
    console.log(`Built ${building.name}!`);
    updateUI();
}

// Recruit Unit
function recruitUnit(tile, unitType) {
    const unit = UNITS[unitType];
    
    if (gameState.player.gold < unit.cost) {
        alert('Not enough gold!');
        return;
    }
    
    gameState.player.gold -= unit.cost;
    tile.units.push({ type: unitType, hp: 100 });
    gameState.player.units.set('unit_' + Date.now(), { type: unitType, tile: tile });
    
    console.log(`Recruited ${unit.name}!`);
    updateUI();
}

// Expand Territory
function expandTerritory(tile) {
    if (gameState.player.gold < 50) {
        alert('Not enough gold!');
        return;
    }
    
    gameState.player.gold -= 50;
    tile.owner = gameState.player.id;
    gameState.player.tiles.push(tile);
    
    console.log('Territory expanded!');
    updateUI();
}

// Attack Tile
function attackTile(tile) {
    if (tile.owner === gameState.player.id) {
        alert('Cannot attack your own territory!');
        return;
    }
    
    // Simple combat simulation
    const attackPower = gameState.player.units.size * 5 + Math.random() * 20;
    const defendPower = tile.units.length * 3 + Math.random() * 10;
    
    if (attackPower > defendPower) {
        alert('You conquered the tile!');
        tile.owner = gameState.player.id;
        tile.building = null;
        tile.units = [];
        gameState.player.tiles.push(tile);
    } else {
        alert('Attack failed! Enemy defense too strong.');
    }
    
    updateUI();
}

// Update UI
function updateUI() {
    document.getElementById('goldCount').textContent = gameState.player.gold;
    document.getElementById('oilCount').textContent = gameState.player.oil;
    document.getElementById('popCount').textContent = gameState.player.population;
}

// Game Loop
function gameLoop() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = document.getElementById('mapContainer').clientWidth;
    canvas.height = document.getElementById('mapContainer').clientHeight;
    
    // Draw game
    drawGame(canvas, ctx);
    
    // Resource production
    gameState.player.tiles.forEach(tile => {
        if (tile.type.resource === 'gold') {
            gameState.player.gold += 0.1;
        } else if (tile.type.resource === 'oil') {
            gameState.player.oil += 0.1;
        }
        
        if (tile.building && tile.building.gold) {
            gameState.player.gold += tile.building.gold * 0.01;
        }
        if (tile.building && tile.building.oil) {
            gameState.player.oil += tile.building.oil * 0.01;
        }
    });
    
    gameState.gameTime += 1;
    
    if (gameState.gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Utility function
function getTileKey(tile) {
    return `${tile.q}_${tile.r}`;
}

// UI Controls
document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('game').classList.add('active');
    initGame();
});

document.getElementById('menuBtn').addEventListener('click', () => {
    gameState.gameRunning = false;
    document.getElementById('game').classList.remove('active');
    document.getElementById('menu').classList.add('active');
    gameState = {
        player: null,
        map: [],
        tiles: new Map(),
        gameTime: 0,
        selectedTile: null,
        gameRunning: false,
        players: new Map()
    };
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('settings').classList.add('active');
});

document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('settings').classList.remove('active');
    document.getElementById('menu').classList.add('active');
});

// Canvas Click Handler
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('click', (e) => handleTileClick(canvas, e));
    }
});
