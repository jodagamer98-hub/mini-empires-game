# Mini Empires - Web Edition

A strategy game where you build your empire on a procedurally generated hexagonal map, recruit units, and conquer territory.

## 🎮 Features

- **Procedurally Generated Maps** - Every game has a unique randomized hexagonal map
- **Real-time Gameplay** - Build, recruit, and attack in real-time
- **Resource Management** - Gold and Oil production from buildings and resource tiles
- **Unit System** - Recruit different unit types with unique stats (Builders, Soldiers, Archers, Knights)
- **Building System** - Construct farms, barracks, factories, and towers
- **Territory Control** - Expand your empire by conquering neutral and enemy tiles
- **Combat System** - Attack enemy bases with your army

## 🚀 Quick Start

1. Clone the repository
```bash
git clone https://github.com/jodagamer98-hub/mini-empires-game.git
cd mini-empires-game
```

2. Open `index.html` in your browser
```bash
# Or use a local server
python -m http.server 8000
# Then open http://localhost:8000
```

3. Click "PLAY NOW" to start a game

## 📊 Game Mechanics

### Resources
- **Gold** - Primary currency for building and recruiting
- **Oil** - Secondary resource for advanced buildings

### Tile Types
- **Grass** - Neutral terrain
- **Forest** - Neutral terrain
- **Mountain** - Neutral terrain
- **Water** - Neutral terrain
- **Gold Mine** - Produces gold
- **Oil Well** - Produces oil

### Buildings
| Building | Cost | Gold/sec | Oil/sec | Time |
|----------|------|----------|---------|------|
| Farm | 50g | +2 | - | 5s |
| Barracks | 100g | - | - | 10s |
| Factory | 150g | +1 | +2 | 15s |
| Tower | 200g | - | - | 8s |

### Units
| Unit | Cost | Attack | Defense | Speed |
|------|------|--------|---------|-------|
| Builder | 25g | 0 | 0 | 2 |
| Soldier | 50g | 5 | 3 | 2 |
| Archer | 60g | 7 | 2 | 2 |
| Knight | 100g | 10 | 8 | 1 |

## 🎯 Gameplay Tips

1. **Early Game** - Focus on expanding territory and building farms for gold production
2. **Mid Game** - Build barracks to recruit soldiers for defense and expansion
3. **Late Game** - Upgrade to advanced units and factories for better resource production
4. **Defense** - Towers and units defend your territory from enemy attacks
5. **Territory** - Control more tiles = more resources = faster progression

## 🛠️ Development

### Project Structure
```
mini-empires-game/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── game.js         # Core game logic
├── netlify.toml    # Netlify deployment config
└── README.md       # This file
```

### Key Files Breakdown

**index.html**
- Menu, game, and settings screens
- Canvas for rendering the game world
- UI panels for stats and actions

**game.js**
- Game configuration and constants
- Map generation algorithm
- Game state management
- Tile rendering and hexagonal geometry
- Building, unit, and combat systems
- Game loop (60 FPS)

**styles.css**
- Responsive design
- Color schemes and animations
- Button and panel styling

## 🌐 Deployment

### Deploy to Netlify (Free)

1. Push to GitHub (already done)
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your GitHub repo
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: (leave empty)
6. Click Deploy

Your game will be live at: `https://your-username.netlify.app`

### Deploy to Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Deploy (no configuration needed)

## 🎮 How to Play

1. **Start Game** - Click "PLAY NOW" from menu
2. **Explore** - Click on tiles to select them
3. **Expand** - Click "Expand" on neutral tiles to take control (50g)
4. **Build** - On your tiles, build farms, barracks, factories, towers
5. **Recruit** - Recruit different unit types for offense and defense
6. **Attack** - Attack enemy tiles with your units
7. **Conquer** - Defeat enemies and expand your empire!

## 🐛 Known Issues

- Map panning/scrolling not yet implemented
- Multiplayer not yet implemented (single-player only)
- AI players not yet implemented
- Leaderboard not yet implemented

## 📋 Future Updates

- [ ] Multiplayer real-time gameplay
- [ ] AI opponents
- [ ] Leaderboards
- [ ] Advanced map features (natural obstacles, events)
- [ ] Technology/Research tree
- [ ] Alliance system
- [ ] Persistent saved games
- [ ] Mobile touch controls

## 📝 License

Open source - feel free to modify and distribute!

## 👨‍💻 Author

Built with ❤️ for strategy game lovers

---

**Play now!** Open `index.html` in your browser and start building your empire! 🏰
