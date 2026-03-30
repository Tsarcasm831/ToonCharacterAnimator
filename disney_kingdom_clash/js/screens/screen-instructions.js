export const instructionsScreenHTML = `
<div id="instructions-screen" class="menu-overlay">
    <h2>How to Play</h2>
    <div class="instructions-content">
        <p><strong>The Goal:</strong> Your realm is under attack by glitches called <strong>Disruptions</strong>! Survive all waves of them to win.</p>
        
        <h3>Preparing for Battle:</h3>
        <ul>
            <li>First, pick a <strong>Realm</strong> to defend from the Battle screen.</li>
            <li>Next, you'll go to the planning screen to build your <strong>Deck</strong> of 5 heroes for the fight.</li>
        </ul>

        <h3>In Battle:</h3>
        <ul>
            <li><strong>Summon Heroes:</strong> Spend Mana to use the <strong>Summon</strong> button. A random hero from your deck will appear on an empty grid space. The cost to summon increases each time!</li>
            <li><strong>Merge Heroes:</strong> To create more powerful units, select a hero and click <strong>Merge</strong>. If there's an identical hero (same character and level) on the board, they will combine into a more powerful, higher-level version.</li>
            <li><strong>Hero Abilities:</strong> Use your heroes' powerful special abilities via the buttons at the bottom of the screen. A hero must be on the grid to use their ability. Watch out for the cooldown!</li>
            <li><strong>Get More Mana:</strong> Defeating Disruptions grants you more Mana to summon with.</li>
        </ul>
        <p>Good luck, hero!</p>
    </div>
    <button class="back-button" data-target="menu-screen">Back</button>
</div>
`;

