export const optionsScreenHTML = `
<div id="options-screen" class="menu-overlay">
    <h2>Options</h2>
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
        <p><label>Dev Mode (Unlock All Heroes): <input type="checkbox" aria-label="Dev Mode"></label></p>
    </div>
    <button class="back-button" data-target="main-menu-screen">Back</button>
</div>
`;

