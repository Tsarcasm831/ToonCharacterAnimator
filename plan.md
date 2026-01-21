# Comprehensive Development Plan for ToonCharacterAnimator World System

## Overview
This plan outlines the implementation of a hierarchical world system with multiple scene layers, from the global world map down to individual building interiors. The system follows a nested structure where each scene type contains and manages scenes at the next level of detail.

## Current State Analysis

### ✅ Implemented Systems
1. **World Map Scene** (`WorldScene.tsx`)
   - Top-down SVG-based world visualization
   - Displays lands, islands, cities, and special locations
   - Interactive with hover states and click handlers
   - Accessible via comma key through `WorldMapModal`

2. **Land Scene** (`LandScene.tsx`)
   - 3D terrain-based travel scene
   - Uses `WorldEnvironment` for terrain rendering
   - Player movement and interaction systems
   - Transition point to combat encounters

3. **Combat Scene** (`CombatScene.tsx`)
   - Grid-based tactical combat system
   - Turn-based unit control
   - Separate from land/world scenes
   - Auto-battler functionality

4. **Scene Management** (`SceneManager.ts`)
   - Handles switching between 'dev', 'land', and 'combat' scenes
   - Manages environment visibility and entity cleanup
   - Coordinate transformation between scenes

5. **Modal Systems**
   - `WorldMapModal` for global map
   - `LandMapModal` for local land view
   - Proper z-index layering (70-80 range)

## 🚧 Planned Systems (From Overview)

### 1. Area Map Scene
**Purpose**: More detailed environment with faster movement and richer interactions

**Requirements**:
- Land map broken into chunks
- Each chunk has its own area map
- More detailed features than land map
- Faster player movement
- Environmental interactions
- Combat options: Auto-battle OR overworld with hitboxes
- TFT-style combat for larger groups/town defense

**Implementation Plan**:
1. **Data Structure** (`data/areaMaps/`)
   - Define chunk system for land division
   - Create area map data for each chunk
   - Include points of interest, resources, encounter zones

2. **Scene Component** (`components/AreaScene.tsx`)
   - New scene type in `SceneManager`
   - 3D environment with detailed props
   - Faster movement system (2x-3x land speed)
   - Interaction system for objects/NPCs

3. **Environment Class** (`game/environment/AreaEnvironment.ts`)
   - Detailed terrain with props
   - Resource nodes (trees, rocks, etc.)
   - Building placement zones
   - Encounter trigger areas

4. **Integration**:
   - Add 'area' to `SceneType` union
   - Update `SceneManager.switchScene()` for area spawns
   - Transition from land to area when entering chunk

### 2. Town Map Scene
**Purpose**: Town building and management within area maps

**Requirements**:
- Smaller than land map scale
- Player can build and manage town
- Interact with town environment
- Contains buildings leading to interiors

**Implementation Plan**:
1. **Data Structure** (`data/towns/`)
   - Town layouts and templates
   - Building placement rules
   - Town progression data

2. **Scene Component** (`components/TownScene.tsx`)
   - Isometric or top-down view
   - Building placement interface
   - NPC management system
   - Town economy integration

3. **Environment Class** (`game/environment/TownEnvironment.ts`)
   - Grid-based building system
   - Town services and facilities
   - Citizen AI and pathfinding

4. **Integration**:
   - Add 'town' to scene types
   - Transition from area when entering town zone
   - Save/load town state persistence

### 3. Building Interior Scene
**Purpose**: Detailed interior interactions and NPC relationships

**Requirements**:
- Dynamically changes based on building
- Scales with building size
- Individual NPC interactions
- Relationship building system

**Implementation Plan**:
1. **Data Structure** (`data/buildings/`)
   - Interior layouts for each building type
   - Furniture and object placement
   - NPC schedules and locations

2. **Scene Component** (`components/BuildingInteriorScene.tsx`)
   - Interior rendering system
   - Conversation system
   - Mini-games and activities
   - Relationship UI

3. **Environment Class** (`game/environment/BuildingInteriorEnvironment.ts`)
   - Room-based loading
   - Lighting and atmosphere
   - Interactive objects

4. **Integration**:
   - Add 'interior' to scene types
   - Dynamic loading based on building entered
   - State preservation for each building

## Detailed Implementation Steps

### Phase 1: Area Map System

#### Step 1.1: Chunk System
```typescript
// data/areaMaps/chunkSystem.ts
export interface ChunkData {
  id: string;
  landX: number;
  landZ: number;
  areaMap: AreaMapData;
  connections: string[]; // Adjacent chunk IDs
}

export interface AreaMapData {
  terrain: TerrainData;
  pointsOfInterest: POI[];
  resources: ResourceNode[];
  encounters: EncounterZone[];
  towns: TownLocation[];
}
```

#### Step 1.2: Update Scene Management
```typescript
// game/managers/SceneManager.ts
export type SceneType = 'dev' | 'land' | 'combat' | 'area' | 'town' | 'interior';

// Add to constructor
this.areaEnvironment = new AreaEnvironment(scene);
this.townEnvironment = new TownEnvironment(scene);
this.interiorEnvironment = new BuildingInteriorEnvironment(scene);
```

#### Step 1.3: Area Scene Implementation
- Create `AreaScene.tsx` similar to `LandScene.tsx`
- Implement faster movement multiplier
- Add interaction system for objects
- Create area-specific UI elements

#### Step 1.4: Transition System
```typescript
// game/managers/TransitionManager.ts
export class TransitionManager {
  static fromLandToArea(chunkId: string) {
    // Load area data
    // Position player at area entrance
    // Switch scene with transition effect
  }
  
  static fromAreaToLand(previousChunk: string) {
    // Return player to land position
    // Clean area resources
  }
}
```

### Phase 2: Town System

#### Step 2.1: Building Framework
```typescript
// game/building/TownBuilding.ts
export interface TownBuilding {
  id: string;
  type: BuildingType;
  level: number;
  position: Vector3;
  interior: BuildingInterior;
  residents: NPC[];
}

export enum BuildingType {
  HOUSE = 'house',
  SHOP = 'shop',
  TAVERN = 'tavern',
  FORGE = 'forge',
  // ...
}
```

#### Step 2.2: Town Management
```typescript
// game/managers/TownManager.ts
export class TownManager {
  buildings: TownBuilding[];
  citizens: NPC[];
  economy: TownEconomy;
  
  placeBuilding(type: BuildingType, position: Vector3) {
    // Validate placement
    // Create building
    // Update town layout
  }
  
  enterBuilding(buildingId: string) {
    // Load interior scene
    // Position NPCs
  }
}
```

### Phase 3: Interior System

#### Step 3.1: Dynamic Interiors
```typescript
// game/environment/BuildingInteriorEnvironment.ts
export class BuildingInteriorEnvironment {
  loadInterior(building: TownBuilding) {
    // Generate interior based on building type
    // Place furniture and objects
    // Set lighting and atmosphere
  }
}
```

#### Step 3.2: Relationship System
```typescript
// game/social/RelationshipManager.ts
export class RelationshipManager {
  relationships: Map<string, RelationshipData>;
  
  buildRelationship(npcId: string, playerAction: SocialAction) {
    // Update relationship values
    // Unlock new dialogue options
    // Trigger special events
  }
}
```

## Technical Considerations

### Performance Optimization
1. **Scene Streaming**: Only load active scene and adjacent chunks
2. **Object Pooling**: Reuse interior objects and NPCs
3. **LOD System**: Different detail levels for each scene
4. **Async Loading**: Load scenes in background during transitions

### State Management
1. **Save System**: Persist state for each scene level
2. **Scene Stack**: Maintain history for quick back navigation
3. **Shared State**: Economy, inventory, relationships across scenes

### UI/UX Considerations
1. **Transition Effects**: Smooth fades between scenes
2. **Loading Screens**: Contextual loading for each scene type
3. **Minimap Integration**: Show position in scene hierarchy
4. **Quick Travel**: Fast travel between visited locations

## Integration Checklist

### Core Systems Updates
- [ ] Update `types.ts` with new scene types
- [ ] Extend `PlayerConfig` for scene-specific settings
- [ ] Update `Game.ts` for new scene handling
- [ ] Modify `useGame.ts` hook for new scenes

### Data Structure Creation
- [ ] Create `data/areaMaps/` directory structure
- [ ] Create `data/towns/` directory structure
- [ ] Create `data/buildings/` directory structure
- [ ] Define chunk coordinate system

### Scene Components
- [ ] `AreaScene.tsx` component
- [ ] `TownScene.tsx` component
- [ ] `BuildingInteriorScene.tsx` component
- [ ] Corresponding modal components for maps

### Environment Classes
- [ ] `AreaEnvironment.ts`
- [ ] `TownEnvironment.ts`
- [ ] `BuildingInteriorEnvironment.ts`

### Manager Classes
- [ ] `TransitionManager.ts`
- [ ] `TownManager.ts`
- [ ] `RelationshipManager.ts`
- [ ] `AreaManager.ts`

### UI Components
- [ ] Area map UI
- [ ] Town management UI
- [ ] Building placement UI
- [ ] Relationship status UI
- [ ] Interior interaction UI

## Testing Strategy

### Unit Tests
- Scene transition logic
- Chunk loading/unloading
- Building placement validation
- State persistence

### Integration Tests
- Full scene hierarchy navigation
- Save/load across scenes
- Performance with multiple scenes
- Memory usage during transitions

### User Testing
- Scene transition smoothness
- Intuitive navigation
- Loading time acceptance
- Feature discoverability

## Timeline Estimate

### Phase 1: Area Maps (4-6 weeks)
- Week 1-2: Data structures and chunk system
- Week 3-4: Area scene and environment
- Week 5-6: Transitions and integration

### Phase 2: Town System (6-8 weeks)
- Week 1-2: Building framework
- Week 3-4: Town scene and management
- Week 5-6: Economy and citizen AI
- Week 7-8: Integration and polish

### Phase 3: Interiors (4-6 weeks)
- Week 1-2: Interior generation system
- Week 3-4: Relationship system
- Week 5-6: Social interactions and polish

### Total: 14-20 weeks

## Success Metrics

1. **Performance**: Scene transitions under 2 seconds
2. **Memory**: Total memory usage under 2GB
3. **User Experience**: 90% positive feedback on navigation
4. **Content**: 50+ unique interiors, 10+ town types
5. **Systems**: Fully functional economy and relationship systems

## Risks and Mitigations

### Technical Risks
- **Memory Leaks**: Implement strict cleanup in scene transitions
- **Performance**: Use profiling tools, optimize critical paths
- **State Corruption**: Regular save validation, backup systems

### Design Risks
- **Navigation Confusion**: Clear visual indicators, mini-maps
- **Content Overwhelm**: Guided introduction, progressive reveal
- **Complexity**: Modular design, clear separation of concerns

## Conclusion

This comprehensive plan outlines the creation of a rich, multi-layered world system that provides depth and exploration opportunities while maintaining performance and usability. The phased approach allows for iterative development and testing, ensuring each system is robust before building upon it.

The key to success will be maintaining clean interfaces between scene layers and implementing efficient state management and transition systems. With proper execution, this will create an engaging world that players can explore from macro to micro scale.
