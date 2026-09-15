// ===== MINI EMPIRES V3 =====
// Enhanced with Multiplayer, AI Bots, and Advanced Gameplay

// Game Constants
const GAME_CONFIG = {
    MAP_SIZE: 30,
    HEX_RADIUS: 28,
    MAX_PLAYERS: 30,
    STARTING_GOLD: 600,
    STARTING_OIL: 0,
    STARTING_POP: 10,
    GAME_SPEED: 1,
    GAME_MODE: 'multiplayer' // 'singleplayer', 'multiplayer', 'vs_bot'
};

// Tile Types
const TILE_TYPES = {
    GRASS: { name: 'grass', color: '#2ecc71', resource: null, defense: 1 },
    FOREST: { name: 'forest', color: '#27ae60', resource: null, defense: 1.5 },
    MOUNTAIN: { name: 'mountain', color: '#7f8c8d', resource: null, defense: 2.5 },
    WATER: { name: 'water', color: '#3498db', resource: null, defense: 0 },
    GOLD_MINE: { name: 'gold_mine', color: '#f39c12', resource: 'gold', defense: 1 },
    OIL_WELL: { name: 'oil_well', color: '#34495e', resource: 'oil', defense: 1 }
};

// Building Types (Enhanced)
const BUILDINGS = {
    CORE: { name: 'Core', cost: 0, gold: 0, oil: 0, pop: 5, time: 0, defense: 5 },
    FARM: { name: 'Farm', cost: 50, gold: 3, oil: 0, pop: 2, time: 5, defense: 1 },
    BARRACKS: { name: 'Barracks', cost: 100, gold: 0, oil: 0, pop: 3, time: 10, defense: 3, unitCap: 5 },
    FACTORY: { name: 'Factory', cost: 150, gold: 2, oil: 3, pop: 4, time: 15, defense: 2 },
    TOWER: { name: 'Tower', cost: 200, gold: 0, oil: 0, pop: 2, time: 8, defense: 8 },
    MARKET: { name: 'Market', cost: 100, gold: 1, oil: 1, pop: 2, time: 7, defense: 1 },
    WALL: { name: 'Wall', cost: 75, gold: 0, oil: 0, pop: 1, time: 4, defense: 4 }
};

// Unit Types (Enhanced)
const UNITS = {
    BUILDER: { name: 'Builder', cost: 25, attack: 0, defense: 0, speed: 3, vision: 3 },
    SCOUT: { name: 'Scout', cost: 30, attack: 1, defense: 1, speed: 4, vision: 4 },
    SOLDIER: { name: 'Soldier', cost: 50, attack: 6, defense: 4, speed: 2, vision: 2 },
    ARCHER: { name: 'Archer', cost: 60, attack: 8, defense: 2, speed: 2, vision: 3 },
    KNIGHT: { name: 'Knight', cost: 100, attack: 12, defense: 10, speed: 1.5, vision: 2 },
    MAGE: { name: 'Mage', cost: 80, attack: 10, defense: 3, speed: 2, vision: 3 }
};

// Game State
let gameState = {
    player: null,
    opponent: null,
    map: [],
    tiles: new Map(),
    gameTime: 0,
    selectedTile: null,
    gameRunning: false,
    players: new Map(),
    gameMode: GAME_CONFIG.GAME_MODE,
    isMultiplayer: false,
    gameStats: {
        playerTerritoryCount: 0,
        opponentTerritoryCount: 0,
        playerGoldPerSec: 0,
        opponentGoldPerSec: 0
    }
};

// ===== MULTIPLAYER SYSTEM =====

class MultiplayerManager {
    constructor() {
        this.isConnected = false;
        this.playerId = 'player_' + Date.now();
        this.opponentId = null;
        this.gameRoom = null;
    }

    // Simulate multiplayer connection (WebSocket would go here)
    connectToServer(mode = 'matchmaking') {
        console.log(`[Multiplayer] Connecting via ${mode}...`);
        
        if (mode === 'matchmaking') {
            // Find random opponent
            this.gameRoom = 'room_' + Math.random().toString(36).substr(2, 9);
            this.opponentId = 'opponent_' + Date.now();
        } else if (mode === 'friend') {
            // Friend code system
            this.gameRoom = 'friend_' + Math.random().toString(36).substr(2, 9);
        }
        
        this.isConnected = true;
        return { gameRoom: this.gameRoom, playerId: this.playerId };
    }

    // Sync player actions
    syncAction(action, data) {
        console.log(`[Sync] ${action}:`, data);
        // In real version, send via WebSocket
        // ws.send(JSON.stringify({ action, data, playerId: this.playerId }));
    }

    // Receive opponent actions
    receiveOpponentAction(action, data) {
        console.log(`[Opponent] ${action}:`, data);
        if (gameState.opponent) {
            switch(action) {
                case 'expand_territory':
                    this.applyOpponentExpansion(data);
                    break;
                case 'attack':
                    this.applyOpponentAttack(data);
                    break;
                case 'build':
                    this.applyOpponentBuild(data);
                    break;
            }
        }
    }

    applyOpponentExpansion(data) {
        const tile = gameState.map.find(t => t.q === data.q && t.r === data.r);
        if (tile && !tile.owner) {
            tile.owner = gameState.opponent.id;
            gameState.opponent.tiles.push(tile);
        }
    }

    applyOpponentAttack(data) {
        const tile = gameState.map.find(t => t.q === data.q && t.r === data.r);
        if (tile && tile.owner === gameState.player.id) {
            this.resolveAttack(tile, gameState.opponent, gameState.player);
        }
    }

    applyOpponentBuild(data) {
        const tile = gameState.map.find(t => t.q === data.q && t.r === data.r);
        if (tile && tile.owner === gameState.opponent.id) {
            tile.building = BUILDINGS[data.buildingType];
        }
    }

    resolveAttack(tile, attacker, defender) {
        const attackPower = attacker.units.size * 5 + Math.random() * 20;
        const defendPower = tile.units.length * 3 + defender.gold * 0.1;
        
        if (attackPower > defendPower) {
            tile.owner = attacker.id;
            tile.units = [];
            attacker.tiles.push(tile);
        }
    }
}

const multiplayerManager = new MultiplayerManager();

// ===== AI BOT SYSTEM =====

class AIBot {
    constructor(playerId, difficulty = 'medium') {
        this.id = playerId;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'extreme'
        this.strategy = this.selectStrategy();
        this.lastActionTime = 0;
        this.actionCooldown = this.getActionCooldown();
        this.targetTile = null;
        this.expansionPath = [];
    }

    selectStrategy() {
        const strategies = ['aggressive', 'defensive', 'economic', 'balanced'];
        if (this.difficulty === 'easy') return strategies[0]; // aggressive but dumb
        if (this.difficulty === 'medium') return strategies[3]; // balanced
        if (this.difficulty === 'hard') return strategies[1]; // defensive & smart
        return strategies[2]; // economic (most efficient)
    }

    getActionCooldown() {
        const cooldowns = { easy: 3000, medium: 2000, hard: 1500, extreme: 1000 };
        return cooldowns[this.difficulty] || 2000;
    }

    // Main AI decision loop
    think(player, opponent, map) {
        const now = Date.now();
        if (now - this.lastActionTime < this.actionCooldown) return;

        // Analyze board state
        const boardState = this.analyzeBoardState(player, map);
        
        // Make decision based on strategy
        let action = null;
        switch(this.strategy) {
            case 'aggressive':
                action = this.aggressiveStrategy(player, opponent, boardState);
                break;
            case 'defensive':
                action = this.defensiveStrategy(player, opponent, boardState);
                break;
            case 'economic':
                action = this.economicStrategy(player, opponent, boardState);
                break;
            case 'balanced':
                action = this.balancedStrategy(player, opponent, boardState);
                break;
        }

        if (action) {
            this.executeAction(action, player, map);
            this.lastActionTime = now;
        }
    }

    analyzeBoardState(player, map) {
        const myTiles = map.filter(t => t.owner === player.id);
        const goldTiles = myTiles.filter(t => t.type.resource === 'gold');
        const enemyTiles = map.filter(t => t.owner && t.owner !== player.id);
        const neutralTiles = map.filter(t => !t.owner);
        
        // Find nearby expansion targets
        const nearbyNeutral = this.findNearbyTiles(myTiles, neutralTiles, 3);
        
        // Calculate military strength
        const unitCount = player.units.size;
        const towerCount = myTiles.filter(t => t.building && t.building.name === 'Tower').length;

        return {
            myTiles,
            goldTiles,
            enemyTiles,
            neutralTiles,
            nearbyNeutral,
            unitCount,
            towerCount,
            goldPerSec: this.calculateGoldPerSec(myTiles)
        };
    }

    findNearbyTiles(myTiles, targetTiles, range) {
        const nearby = [];
        myTiles.forEach(myTile => {
            targetTiles.forEach(target => {
                const distance = Math.sqrt(Math.pow(myTile.q - target.q, 2) + Math.pow(myTile.r - target.r, 2));
                if (distance <= range) {
                    nearby.push({ tile: target, distance });
                }
            });
        });
        return nearby.sort((a, b) => a.distance - b.distance).slice(0, 5);
    }

    calculateGoldPerSec(tiles) {
        let gold = 0;
        tiles.forEach(t => {
            if (t.type.resource === 'gold') gold += 0.1;
            if (t.building) gold += t.building.gold * 0.01;
        });
        return gold;
    }

    aggressiveStrategy(player, opponent, boardState) {
        // Attack enemy tiles, build barracks & archers
        if (player.gold > 100) {
            const enemyNearby = boardState.enemyTiles.slice(0, 3);
            if (enemyNearby.length > 0) {
                return { type: 'attack', tile: enemyNearby[0] };
            }
        }

        if (player.gold > 50 && boardState.unitCount < 15) {
            return { type: 'recruit', unitType: Math.random() > 0.5 ? 'SOLDIER' : 'ARCHER' };
        }

        if (player.gold > 100 && boardState.myTiles.length > 5) {
            return { type: 'build', buildingType: 'BARRACKS', tile: boardState.myTiles[0] };
        }

        return { type: 'expand', tile: boardState.nearbyNeutral[0] };
    }

    defensiveStrategy(player, opponent, boardState) {
        // Build towers, defend territory, counter-attack
        if (player.gold > 200 && boardState.myTiles.length % 3 === 0) {
            return { type: 'build', buildingType: 'TOWER', tile: boardState.myTiles[Math.floor(Math.random() * boardState.myTiles.length)] };
        }

        if (player.gold > 100 && boardState.unitCount < 10) {
            return { type: 'recruit', unitType: 'KNIGHT' };
        }

        return { type: 'expand', tile: boardState.nearbyNeutral[0] };
    }

    economicStrategy(player, opponent, boardState) {
        // Maximize gold production: farms, markets, gold mines
        if (player.gold > 50 && boardState.nearbyNeutral.length > 0) {
            return { type: 'expand', tile: boardState.nearbyNeutral[0] };
        }

        if (player.gold > 50 && boardState.myTiles.length % 4 === 0) {
            return { type: 'build', buildingType: 'FARM', tile: boardState.myTiles[0] };
        }

        if (player.gold > 100 && boardState.myTiles.length % 6 === 0) {
            return { type: 'build', buildingType: 'MARKET', tile: boardState.myTiles[0] };
        }

        if (player.gold > 30 && boardState.unitCount < 5) {
            return { type: 'recruit', unitType: 'BUILDER' };
        }

        return null;
    }

    balancedStrategy(player, opponent, boardState) {
        // Mix of everything
        const rand = Math.random();

        if (rand < 0.3 && player.gold > 100 && boardState.nearbyNeutral.length > 0) {
            return { type: 'expand', tile: boardState.nearbyNeutral[0] };
        }

        if (rand < 0.5 && player.gold > 50) {
            return { type: 'build', buildingType: 'FARM', tile: boardState.myTiles[0] };
        }

        if (rand < 0.7 && player.gold > 60 && boardState.unitCount < 12) {
            return { type: 'recruit', unitType: 'SOLDIER' };
        }

        if (rand < 0.9 && boardState.enemyTiles.length > 0) {
            return { type: 'attack', tile: boardState.enemyTiles[0] };
        }

        return null;
    }

    executeAction(action, player, map) {
        switch(action.type) {
            case 'expand':
                if (action.tile && player.gold >= 50) {
                    action.tile.owner = player.id;
                    player.gold -= 50;
                    player.tiles.push(action.tile);
                }
                break;

            case 'build':
                const building = BUILDINGS[action.buildingType];
                if (action.tile && player.gold >= building.cost) {
                    action.tile.building = building;
                    player.gold -= building.cost;
                }
                break;

            case 'recruit':
                const unit = UNITS[action.unitType];
                if (player.gold >= unit.cost && player.tiles.length > 0) {
                    player.gold -= unit.cost;
                    const randomTile = player.tiles[Math.floor(Math.random() * player.tiles.length)];
                    randomTile.units.push({ type: action.unitType, hp: 100 });
                    player.units.set('unit_' + Date.now(), { type: action.unitType, tile: randomTile });
                }
                break;

            case 'attack':
                const attackPower = player.units.size * 5 + Math.random() * 30;
                const defendPower = action.tile.units.length * 3;
                if (attackPower > defendPower) {
                    action.tile.owner = player.id;
                    action.tile.units = [];
                    player.tiles.push(action.tile);
                }
                break;
        }
    }
}

// ===== ENHANCED GAME FUNCTIONS =====

function initGame(gameMode = 'singleplayer', difficulty = 'medium') {
    console.log(`Initializing game... Mode: ${gameMode}, Difficulty: ${difficulty}`);
    
    gameState.gameMode = gameMode;
    gameState.map = generateEnhancedHexMap(GAME_CONFIG.MAP_SIZE);
    
    // Create player
    gameState.player = {
        id: 'player_' + Date.now(),
        name: 'You',
        gold: GAME_CONFIG.STARTING_GOLD,
        oil: GAME_CONFIG.STARTING_OIL,
        population: GAME_CONFIG.STARTING_POP,
        tiles: [],
        buildings: new Map(),
        units: new Map(),
        aiBot: null
    };

    // Create opponent (real player or AI)
    if (gameMode === 'vs_bot') {
        gameState.opponent = {
            id: 'opponent_' + Date.now(),
            name: 'AI Bot',
            gold: GAME_CONFIG.STARTING_GOLD,
            oil: GAME_CONFIG.STARTING_OIL,
            population: GAME_CONFIG.STARTING_POP,
            tiles: [],
            buildings: new Map(),
            units: new Map(),
            aiBot: new AIBot('opponent_' + Date.now(), difficulty)
        };
        gameState.isMultiplayer = false;
    } else if (gameMode === 'multiplayer') {
        gameState.isMultiplayer = true;
        const connectionInfo = multiplayerManager.connectToServer('matchmaking');
        
        gameState.opponent = {
            id: connectionInfo.opponentId,
            name: 'Player 2',
            gold: GAME_CONFIG.STARTING_GOLD,
            oil: GAME_CONFIG.STARTING_OIL,
            population: GAME_CONFIG.STARTING_POP,
            tiles: [],
            buildings: new Map(),
            units: new Map()
        };
    }

    // Assign starting positions (opposite corners)
    const mapArray = gameState.map;
    let startTile1 = mapArray[0];
    let startTile2 = mapArray[mapArray.length - 1];

    startTile1.owner = gameState.player.id;
    startTile1.building = BUILDINGS.CORE;
    gameState.player.tiles.push(startTile1);
    gameState.player.buildings.set(getTileKey(startTile1), { type: 'CORE', buildTime: 0 });
    gameState.player.units.set('builder_1', { type: 'BUILDER', tile: startTile1 });
    gameState.player.units.set('builder_2', { type: 'BUILDER', tile: startTile1 });

    startTile2.owner = gameState.opponent.id;
    startTile2.building = BUILDINGS.CORE;
    gameState.opponent.tiles.push(startTile2);
    gameState.opponent.buildings.set(getTileKey(startTile2), { type: 'CORE', buildTime: 0 });
    gameState.opponent.units.set('builder_1', { type: 'BUILDER', tile: startTile2 });
    gameState.opponent.units.set('builder_2', { type: 'BUILDER', tile: startTile2 });

    gameState.gameRunning = true;
    gameLoop();
}

// Enhanced map generation with better distribution
function generateEnhancedHexMap(size) {
    const tiles = [];
    const resourceDensity = { gold: 0.08, oil: 0.06, forest: 0.25, mountain: 0.15 };
    
    for (let q = 0; q < size; q++) {
        for (let r = 0; r < size; r++) {
            const rand = Math.random();
            let tileType;

            if (rand < resourceDensity.gold) {
                tileType = TILE_TYPES.GOLD_MINE;
            } else if (rand < resourceDensity.gold + resourceDensity.oil) {
                tileType = TILE_TYPES.OIL_WELL;
            } else if (rand < resourceDensity.gold + resourceDensity.oil + resourceDensity.forest) {
                tileType = TILE_TYPES.FOREST;
            } else if (rand < resourceDensity.gold + resourceDensity.oil + resourceDensity.forest + resourceDensity.mountain) {
                tileType = TILE_TYPES.MOUNTAIN;
            } else if (rand < 0.9) {
                tileType = TILE_TYPES.GRASS;
            } else {
                tileType = TILE_TYPES.WATER;
            }

            tiles.push({
                q, r,
                type: tileType,
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

// Hex to Pixel
function hexToPixel(q, r, centerX, centerY) {
    const size = GAME_CONFIG.HEX_RADIUS;
    const x = centerX + size * (3/2 * q);
    const y = centerY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
}

// Draw enhanced game
function drawGame(canvas, ctx) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gameState.map.forEach(tile => {
        const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY);
        drawHexEnhanced(ctx, x, y, GAME_CONFIG.HEX_RADIUS, tile);
    });

    updateUI();
}

// Enhanced hex drawing
function drawHexEnhanced(ctx, centerX, centerY, radius, tile) {
    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.closePath();

    // Fill with base color
    ctx.fillStyle = tile.type.color;
    ctx.fill();

    // Darken if enemy
    if (tile.owner === gameState.opponent?.id) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fill();
    }

    // Highlight if player
    if (tile.owner === gameState.player.id) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fill();
    }

    // Border
    ctx.strokeStyle = tile.owner === gameState.player.id ? '#00ff00' : tile.owner ? '#ff0000' : '#999';
    ctx.lineWidth = tile.owner === gameState.player.id ? 3 : tile.owner ? 2 : 1;
    ctx.stroke();

    // Draw building icon
    if (tile.building) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.building.name.substring(0, 1), centerX, centerY);
    }

    // Draw unit count
    if (tile.units.length > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 9px Arial';
        ctx.fillText(tile.units.length, centerX, centerY + 12);
    }
}

// Handle tile click
function handleTileClick(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

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

// Update tile info
function updateTileInfo(tile) {
    const tileInfoDiv = document.getElementById('tileInfo');
    const actionsDiv = document.getElementById('actions');

    let info = `<strong>${tile.type.name.toUpperCase()}</strong><br>`;
    if (tile.owner === gameState.player.id) {
        info += '✓ Your territory';
        if (tile.building) {
            info += ` - ${tile.building.name}`;
        }
    } else if (tile.owner === gameState.opponent?.id) {
        info += '✗ Enemy territory';
    } else {
        info += '○ Neutral - Expand here';
    }

    if (tile.units.length > 0) {
        info += `<br>Units: ${tile.units.length}`;
    }

    tileInfoDiv.innerHTML = info;

    actionsDiv.innerHTML = '';

    if (tile.owner === gameState.player.id) {
        Object.entries(BUILDINGS).forEach(([key, building]) => {
            if (key !== 'CORE' && !tile.building && gameState.player.gold >= building.cost) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-small btn-secondary';
                btn.textContent = `${building.name} (${building.cost}g)`;
                btn.onclick = () => buildBuilding(tile, key);
                actionsDiv.appendChild(btn);
            }
        });

        Object.entries(UNITS).forEach(([key, unit]) => {
            if (gameState.player.gold >= unit.cost) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-small btn-primary';
                btn.textContent = `${unit.name} (${unit.cost}g)`;
                btn.onclick = () => recruitUnit(tile, key);
                actionsDiv.appendChild(btn);
            }
        });
    } else if (!tile.owner && gameState.player.gold >= 50) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-small btn-primary';
        btn.textContent = 'Expand (50g)';
        btn.onclick = () => expandTerritory(tile);
        actionsDiv.appendChild(btn);
    } else if (tile.owner === gameState.opponent?.id) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-small btn-danger';
        btn.textContent = 'Attack!';
        btn.onclick = () => attackTile(tile);
        actionsDiv.appendChild(btn);
    }
}

// Build building
function buildBuilding(tile, buildingType) {
    const building = BUILDINGS[buildingType];

    if (gameState.player.gold < building.cost) {
        alert('Not enough gold!');
        return;
    }

    gameState.player.gold -= building.cost;
    tile.building = building;
    gameState.player.buildings.set(getTileKey(tile), { type: buildingType, buildTime: building.time });

    if (gameState.isMultiplayer) {
        multiplayerManager.syncAction('build', { q: tile.q, r: tile.r, buildingType });
    }
}

// Recruit unit
function recruitUnit(tile, unitType) {
    const unit = UNITS[unitType];

    if (gameState.player.gold < unit.cost) {
        alert('Not enough gold!');
        return;
    }

    gameState.player.gold -= unit.cost;
    tile.units.push({ type: unitType, hp: 100 });
    gameState.player.units.set('unit_' + Date.now(), { type: unitType, tile });

    if (gameState.isMultiplayer) {
        multiplayerManager.syncAction('recruit', { q: tile.q, r: tile.r, unitType });
    }
}

// Expand territory
function expandTerritory(tile) {
    if (gameState.player.gold < 50) {
        alert('Not enough gold!');
        return;
    }

    gameState.player.gold -= 50;
    tile.owner = gameState.player.id;
    gameState.player.tiles.push(tile);

    if (gameState.isMultiplayer) {
        multiplayerManager.syncAction('expand_territory', { q: tile.q, r: tile.r });
    }
}

// Enhanced combat
function attackTile(tile) {
    if (tile.owner === gameState.player.id) {
        alert('Cannot attack your own territory!');
        return;
    }

    const defenseBonus = tile.type.defense || 1;
    const buildingDefense = tile.building ? tile.building.defense || 0 : 0;

    const attackPower = gameState.player.units.size * 7 + Math.random() * 30;
    const defendPower = (tile.units.length * 4 + buildingDefense * 2) * defenseBonus + Math.random() * 15;

    console.log(`Attack: ${attackPower.toFixed(2)} vs Defense: ${defendPower.toFixed(2)}`);

    if (attackPower > defendPower) {
        alert('✓ Victory! You conquered the tile!');
        tile.owner = gameState.player.id;
        tile.building = null;
        tile.units = [];
        gameState.player.tiles.push(tile);
    } else {
        alert('✗ Defeat! Your attack failed.');
    }

    if (gameState.isMultiplayer) {
        multiplayerManager.syncAction('attack', { q: tile.q, r: tile.r });
    }
}

// Update UI
function updateUI() {
    document.getElementById('goldCount').textContent = gameState.player.gold.toFixed(0);
    document.getElementById('oilCount').textContent = gameState.player.oil.toFixed(0);
    document.getElementById('popCount').textContent = gameState.player.tiles.length;
}

// Enhanced game loop
function gameLoop() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = document.getElementById('mapContainer').clientWidth;
    canvas.height = document.getElementById('mapContainer').clientHeight;

    drawGame(canvas, ctx);

    // Resource production
    gameState.player.tiles.forEach(tile => {
        if (tile.type.resource === 'gold') {
            gameState.player.gold += 0.15;
        } else if (tile.type.resource === 'oil') {
            gameState.player.oil += 0.12;
        }

        if (tile.building) {
            gameState.player.gold += tile.building.gold * 0.015;
            gameState.player.oil += tile.building.oil * 0.015;
        }
    });

    // Opponent production
    gameState.opponent.tiles.forEach(tile => {
        if (tile.type.resource === 'gold') {
            gameState.opponent.gold += 0.15;
        } else if (tile.type.resource === 'oil') {
            gameState.opponent.oil += 0.12;
        }

        if (tile.building) {
            gameState.opponent.gold += tile.building.gold * 0.015;
            gameState.opponent.oil += tile.building.oil * 0.015;
        }
    });

    // AI Bot thinking
    if (!gameState.isMultiplayer && gameState.opponent.aiBot) {
        gameState.opponent.aiBot.think(gameState.opponent, gameState.player, gameState.map);
    }

    // Win condition check
    if (gameState.player.tiles.length === 0) {
        alert('GAME OVER! You were defeated!');
        gameState.gameRunning = false;
        document.getElementById('game').classList.remove('active');
        document.getElementById('menu').classList.add('active');
    }

    if (gameState.opponent.tiles.length === 0) {
        alert('VICTORY! You conquered all territory!');
        gameState.gameRunning = false;
        document.getElementById('game').classList.remove('active');
        document.getElementById('menu').classList.add('active');
    }

    gameState.gameTime += 1;

    if (gameState.gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Utility
function getTileKey(tile) {
    return `${tile.q}_${tile.r}`;
}

// ===== UI CONTROLS =====

document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('gameMode').classList.add('active');
});

document.getElementById('botEasyBtn')?.addEventListener('click', () => {
    document.getElementById('gameMode').classList.remove('active');
    document.getElementById('game').classList.add('active');
    initGame('vs_bot', 'easy');
});

document.getElementById('botMediumBtn')?.addEventListener('click', () => {
    document.getElementById('gameMode').classList.remove('active');
    document.getElementById('game').classList.add('active');
    initGame('vs_bot', 'medium');
});

document.getElementById('botHardBtn')?.addEventListener('click', () => {
    document.getElementById('gameMode').classList.remove('active');
    document.getElementById('game').classList.add('active');
    initGame('vs_bot', 'hard');
});

document.getElementById('multiplayerBtn')?.addEventListener('click', () => {
    document.getElementById('gameMode').classList.remove('active');
    document.getElementById('game').classList.add('active');
    initGame('multiplayer');
});

document.getElementById('menuBtn')?.addEventListener('click', () => {
    gameState.gameRunning = false;
    document.getElementById('game').classList.remove('active');
    document.getElementById('menu').classList.add('active');
    gameState = {
        player: null,
        opponent: null,
        map: [],
        gameRunning: false
    };
});

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('settings').classList.add('active');
});

document.getElementById('backBtn')?.addEventListener('click', () => {
    document.getElementById('settings').classList.remove('active');
    document.getElementById('menu').classList.add('active');
});

document.getElementById('backFromModeBtn')?.addEventListener('click', () => {
    document.getElementById('gameMode').classList.remove('active');
    document.getElementById('menu').classList.add('active');
});

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('click', (e) => handleTileClick(canvas, e));
    }
});
