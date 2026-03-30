export const inGameSettingsModalHTML = `
<div id="in-game-settings-modal" class="menu-overlay">
    <div class="modal-content">
        <h2>Game Paused</h2>
        <div class="options-content">
            <p><label>Sound Volume: <input type="range" min="0" max="100" aria-label="Sound Volume"></label></p>
            <p><label>Music Volume: <input type="range" min="0" max="100" aria-label="Music Volume"></label></p>
            <p><label>Graphics Quality: 
                <select aria-label="Graphics Quality">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                </select>
            </label></p>
            <p style="font-size: 0.9em; color: #ccc;">Graphics changes require a page refresh.</p>
            <p><label>Dev Mode (Unlock All Heroes): <input type="checkbox" aria-label="Dev Mode"></label></p>
        </div>
        <button id="resume-game-button" class="back-button" style="background-color: #4CAF50;">Resume</button>
        <button id="quit-game-button" class="back-button" style="background-color: #f44336; margin-top: 10px;">Quit to Menu</button>
    </div>
</div>
`;

