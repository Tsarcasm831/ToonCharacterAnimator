# Toon Character Animator & RPG Engine

A sophisticated 3D character animation studio and RPG game engine built with React, TypeScript, and Three.js. Create fully customizable toon characters with procedural animations, build immersive worlds, and deploy complete RPG experiences.

## 🎮 Features

### Character Studio
- **200+ Customization Parameters**: Body proportions, facial features, clothing rigging, equipment positioning
- **Procedural Animation System**: State-machine driven animations with physics simulation
- **Advanced Mesh Building**: Dynamic body morphing, clothing simulation, hair physics
- **Equipment System**: 20+ equipment types with custom rigging and positioning

### Game Engine
- **Multi-Scene Architecture**: World Map, Land Travel, Combat Arenas, Single Biome environments
- **Terrain Generation**: SVG-based land shapes with optimized mesh generation
- **Environment Systems**: Dynamic day/night cycles, weather effects, obstacle population
- **Building System**: Place and construct buildings with ghost preview and rotation

### RPG Systems
- **Combat Engine**: Real-time combat with abilities, status effects, and AI enemies
- **Inventory Management**: Item storage, equipment slots, trading system
- **Quest System**: Objectives, rewards, and progress tracking
- **Economy**: Coins, shops, crafting with forge system

### Technical Features
- **Mobile-First Design**: Touch controls, responsive UI, performance optimization
- **State Management**: React Context with modular hooks for game state
- **Audio Integration**: Dynamic music system with environmental audio
- **Export Capabilities**: Model export, configuration save/load

## 🏗️ Architecture

```
├── components/ui/          # 45+ React UI components
├── game/
│   ├── animator/          # Animation system & state machines
│   ├── builder/           # Building & construction system
│   ├── core/              # Game engine & managers
│   ├── entities/          # NPCs, enemies, animals
│   ├── environment/       # Terrain, lighting, obstacles
│   ├── managers/          # System managers (input, camera, etc.)
│   ├── model/             # 3D model builders & equipment
│   └── player/            # Player controller & systems
├── hooks/                 # React state management hooks
├── contexts/              # Global state providers
└── data/                  # Game data & configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern web browser with WebGL support

### Installation
```bash
git clone https://github.com/Tsarcasm831/ToonCharacterAnimator.git
cd ToonCharacterAnimator
npm install
```

### Development
```bash
npm run dev          # Local development server
npm run dev:public   # Public tunnel for testing
```

### Build
```bash
npm run build        # Production build
npm run preview      # Preview production build
```

## 🎯 Usage

### Character Customization
1. Launch the application and navigate to the Game scene
2. Press the Studio OS button (bottom-right) to open the control panel
3. Use the various tabs to customize:
   - **Body Details**: Proportions, scaling, morphing
   - **Outfit & Gear**: Equipment, clothing, colors
   - **Face & Features**: Facial structure, eyes, hair
   - **Bone Rigging**: Advanced positioning and scaling

### Animation Control
- **Actions & Input**: Trigger animations (walk, run, jump, attack)
- **Impersonate**: Control different character presets
- **Environment**: Adjust time of day, weather, lighting

### Building & World Creation
- Toggle Builder Mode with `toggleBuilder` key
- Select building types from the hotbar
- Use ghost preview for placement
- Rotate structures with `rotateGhost` key

## 🎮 Game Controls

### Movement
- **WASD**: Movement
- **Shift**: Run
- **Space**: Jump
- **C**: Crouch

### Actions
- **Left Click**: Attack/Interact
- **E**: Interact with objects
- **F**: Cast fireball
- **R**: Wave gesture

### UI Controls
- **I**: Inventory
- **M**: Map
- **Comma**: World Map
- **Tab**: Character Stats
- **Escape**: Main Menu

## 🔧 Configuration

The character system supports extensive configuration through the `PlayerConfig` interface:

```typescript
interface PlayerConfig {
  // Base appearance
  bodyType: 'male' | 'female';
  bodyVariant: 'average' | 'muscular' | 'slim' | 'heavy';
  outfit: 'nude' | 'peasant' | 'warrior' | 'noble';
  
  // 200+ additional parameters for:
  // - Body proportions
  // - Facial features
  // - Equipment rigging
  // - Color customization
  // - Animation settings
}
```

## 🎨 Scene Types

### Single Biome Scene
- Simplified environment for character testing
- Flat terrain with customizable biome
- Ideal for animation preview and character creation

### Land Scene
- Large-scale terrain with SVG-based land shapes
- Optimized mesh generation for performance
- Environmental obstacles and population

### Combat Scene
- Dedicated arena for battle encounters
- Combat system with abilities and status effects
- Enemy AI with different behavior patterns

### World Scene
- Overworld map for navigation
- Fast travel between locations
- Quest and progression tracking

## 🛠️ Development

### Project Structure
- **Modular Architecture**: Each system is self-contained
- **TypeScript**: Full type safety throughout
- **React Hooks**: Custom hooks for state management
- **Three.js**: 3D rendering and physics

### Key Systems
- **Animation Pipeline**: Custom state machines with procedural animation
- **Mesh Generation**: Dynamic 3D model creation
- **Physics Simulation**: Ragdoll effects, collision detection
- **Audio Management**: Dynamic music and sound effects

### Performance Features
- **Optimized Rendering**: Efficient mesh generation and culling
- **Mobile Optimization**: Touch controls and performance tuning
- **Memory Management**: Proper cleanup and resource disposal

## 📚 API Reference

### Core Classes
- `Game`: Main game engine and loop
- `Player`: Character controller and model
- `PlayerAnimator`: Animation system coordinator
- `PlayerModel`: 3D model builder and manager
- `SceneManager`: Scene switching and management

### Managers
- `InputManager`: Keyboard and touch input handling
- `CameraManager`: Camera controls and following
- `CombatSystem`: Battle mechanics and resolution
- `BuilderManager`: Building placement and construction
- `EntityManager`: NPC and enemy lifecycle management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Three.js** for 3D rendering capabilities
- **React** for component-based UI
- **TypeScript** for type safety
- **Tailwind CSS** for styling
