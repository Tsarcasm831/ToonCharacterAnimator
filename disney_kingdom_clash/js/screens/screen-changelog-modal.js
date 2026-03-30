export const changelogModalHTML = `
<div id="changelog-modal" class="menu-overlay">
    <div class="modal-content">
        <button id="changelog-close-button" class="close-button">&times;</button>
        <h2>Version History</h2>
        <div class="modal-tabs">
            <button class="tab-button active" data-tab="latest">Latest</button>
            <button class="tab-button" data-tab="older">Older</button>
            <button class="tab-button" data-tab="archive">Archive</button>
        </div>
        <div class="modal-tab-content">
            <div id="latest-tab" class="tab-pane active changelog-container"></div>
            <div id="older-tab" class="tab-pane changelog-container"></div>
            <div id="archive-tab" class="tab-pane changelog-container"></div>
        </div>
    </div>
</div>
`;

