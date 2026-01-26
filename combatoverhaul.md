# Combat System Overhaul: Turn-Based Implementation

## Overview

This document outlines the complete transformation of the current real-time combat system into a turn-based tactical system inspired by Heroes of Might and Magic 4.

## Current System Analysis

### Existing Components:
- **CombatScene.tsx**: Renders combat arena and manages UI
- **CombatInteractionManager.ts**: Handles unit selection, dragging, and basic interactions
- **CombatSystem.ts**: Real-time auto-battler with continuous updates
- **CombatEnvironment.ts**: 13x13 hexagonal grid system

### Problems with Current System:
- Real-time combat doesn't allow strategic thinking
- No turn order or initiative system
- Continuous action without player control
- Limited tactical depth

## Design Philosophy

### Core Principles:
1. **Turn-Based Tactics**: Each unit gets individual turns for movement and actions
2. **Strategic Depth**: Players must consider positioning, range, and timing
3. **Clear Initiative**: Transparent turn order based on unit stats
4. **Resource Management**: Movement points and action points per turn
5. **AI Opponents**: Enemy units make intelligent decisions

## New Architecture

### 1. Core Systems

#### TurnManager (New)
```typescript
class TurnManager {
  // Priority queue (min-heap) for turn order
  // Effective initiative recalculated for buffs/debuffs
  // Two-phase system: active queue and "waited" queue
  // Initiative rolled once per combat (not each round)
}
```

#### CombatSystem (Refactored)
```typescript
class CombatSystem {
  // Removes real-time update loop
  // Implements turn-based state machine
  // Manages unit stats including movement/action points
  // Handles combat resolution per turn
}
```

#### AIController (New)
```typescript
class AIController {
  // Utility-based scoring for action selection
  // Evaluates (move, action) combinations
  // Personality weights per unit type (aggressive/defensive)
  // Cached calculations for performance
}
```

### 2. UI Components

#### TurnIndicatorUI (New)
- Visual queue showing upcoming turns
- Highlights current active unit
- Shows unit portraits/icons and initiative values

#### Smart Cursor System (Enhanced)
- Context-sensitive cursor changes (sword over enemies, boot over walkable cells)
- Direct click-to-move and click-to-attack interface
- Right-click to cancel/deselect
- "Wait" button for delayed turn mechanic

#### MovementRangeVisualizer (Enhanced)
- Shows reachable cells based on movement points
- Highlights attack range for selected unit
- Displays path preview with cost indicators

### 3. Data Model Changes

#### Enhanced EntityStats
```typescript
interface EntityStats {
  // Existing stats...
  movementPoints: number;      // Max movement per turn
  currentMovement: number;     // Remaining movement this turn
  initiative: number;          // Determines turn order
  hasActedThisTurn: boolean;   // Track if unit has attacked
  hasMovedThisTurn: boolean;   // Track if unit has moved
  canAttackAfterMove: boolean; // Special ability for some units
}
```

#### TurnState
```typescript
enum TurnPhase {
  INITIATIVE_ROLL = 'initiative',
  PLAYER_TURN = 'player',
  AI_TURN = 'ai',
  TURN_END = 'end',
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}
```

## Implementation Steps

### Phase 1: Foundation
1. **Update Type Definitions**
   - Add turn-based stats to EntityStats
   - Create TurnState and related enums
   - Define interfaces for turn management

2. **Create TurnManager**
   - Implement initiative calculation
   - Build turn queue system
   - Add turn progression logic

3. **Refactor CombatSystem**
   - Remove update loop
   - Add turn-based state management
   - Implement action point system

### Phase 2: Interaction Updates
1. **Update CombatInteractionManager**
   - Enforce turn order restrictions
   - Add movement point validation
   - Implement action cost system

2. **Create AIController**
   - Basic target selection
   - Movement decision logic
   - Turn execution with delays

### Phase 3: UI Implementation
1. **TurnIndicatorUI**
   - Display turn order queue
   - Show current unit highlight
   - Animate turn transitions

2. **ActionMenuUI**
   - Context-sensitive actions
   - Keyboard shortcuts
   - Visual feedback

3. **Enhanced GameHUD**
   - Add end turn button
   - Show current turn status
   - Display movement/action points

### Phase 4: Polish & Balance
1. **Visual Effects**
   - Turn transition animations
   - Action execution feedback
   - Combat log improvements

2. **Balance Tuning**
   - Movement point values
   - Initiative calculations
   - AI difficulty levels

## Detailed Implementation

### Turn Flow Sequence

1. **Combat Start**
   ```
   Calculate Initiative → Sort Turn Order → Begin First Turn
   ```

2. **Unit Turn**
   ```
   Start Turn → Reset Movement/Action Points → 
   Wait for Player Input OR Execute AI → 
   Execute Actions → End Turn
   ```

3. **Turn End**
   ```
   Apply Effects → Check Victory Conditions → 
   Next Unit in Queue → Loop
   ```

### Movement System

- **Separate Pools**: Movement points for moving, one attack action per turn
- **Grid-Based**: Units occupy hex cells
- **Point Cost**: Each cell costs movement points based on terrain
- **Tactical Choice**: Move then attack OR attack then limited movement
- **Terrain Effects**: Different terrain costs vary (rough terrain costs more)
- **Zones of Control**: Enemy units block movement through adjacent cells

### Combat Resolution

- **Attack Action**: Uses the single attack action for the turn
- **Movement After Attack**: Limited to 50% of remaining movement points
- **Attack After Move**: Full movement then attack (default behavior)
- **Ranged Attacks**: Require line of sight, no counter-attacks
- **Counter Attacks**: Automatic when moving out of adjacent enemy zone
- **Special Abilities**: May replace attack action or have separate costs

### AI Decision Making

1. **Utility Scoring**
   - Score each (position, action) combination
   - Weight factors: damage potential, survival, positioning
   - Personality modifiers per unit type (aggressive/defensive)

2. **Action Evaluation**
   - Calculate best movement position for each target
   - Consider ability usage vs basic attacks
   - Cache calculations for performance

3. **Execution**
   - Show AI thinking (brief delay)
   - Animate movements and attacks
   - Update combat log

### Wait Mechanic

- **Wait Action**: Units can choose to delay their turn
- **Waited Queue**: Units that wait go to a secondary queue
- **Queue Merge**: At end of round, waited queue merges with main queue
- **Tactical Use**: Wait for enemies to move into better positions
- **Initiative Impact**: Waiting units act after all non-waiting units

## Integration Points

### Existing System Modifications

#### CombatScene.tsx
- Add turn-based UI components
- Handle turn state changes
- Manage camera for active unit

#### Game.ts
- Initialize TurnManager
- Connect AI to game loop
- Handle combat end conditions

#### CombatEnvironment.ts
- Add terrain movement costs
- Implement zone of control
- Visual feedback for turn state

### New Event System

```typescript
// Events for turn-based communication
interface CombatEvents {
  onTurnStart: (unit: CombatUnit) => void;
  onTurnEnd: (unit: CombatUnit) => void;
  onActionExecute: (action: Action) => void;
  onCombatEnd: (victory: boolean) => void;
}
```

## Testing Strategy

### Unit Tests
- TurnManager initiative calculation
- Movement point validation
- Action cost deduction

### Integration Tests
- Complete turn flow
- AI decision making
- Victory/defeat conditions

### Play Testing
- Turn pacing and timing
- AI difficulty balance
- UI responsiveness

## Performance Considerations

- AI calculations should be non-blocking
- Turn transitions use smooth animations
- Combat log limited to recent entries
- Grid calculations cached when possible

## Future Enhancements

### Advanced Features
- Cover and elevation bonuses
- Status effects and buffs/debuffs
- Morale system affecting initiative
- Environmental interactions

### Multiplayer Support
- Network turn synchronization
- Turn time limits
- Reconnection handling

## Conclusion

This overhaul transforms the combat system from a simple auto-battler into a deep tactical experience. The turn-based approach encourages strategic thinking while maintaining the fast-paced feel of the original system through smooth animations and clear visual feedback.

The modular design allows for incremental implementation and easy balance adjustments. Each component has clear responsibilities and well-defined interfaces, making the system maintainable and extensible.
