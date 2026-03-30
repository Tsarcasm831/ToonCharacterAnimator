import { GLITCH_DATA } from './data/glitchData.js';

let modal, modalTitle, corruptedPanel, purifiedPanel, descriptionEl;
let corruptedImg, purifiedImg, corruptedName, purifiedName;

export function initGlitchesScreen() {
    // Cache modal elements
    modal = document.getElementById('glitch-details-modal');
    modalTitle = document.getElementById('glitch-modal-title');
    corruptedPanel = document.getElementById('glitch-state-corrupted');
    purifiedPanel = document.getElementById('glitch-state-purified');
    descriptionEl = document.getElementById('glitch-modal-description');
    corruptedImg = document.getElementById('glitch-modal-corrupted-img');
    purifiedImg = document.getElementById('glitch-modal-purified-img');
    corruptedName = document.getElementById('glitch-modal-corrupted-name');
    purifiedName = document.getElementById('glitch-modal-purified-name');
    
    // Add event listener for closing the modal
    const closeButton = document.getElementById('glitch-modal-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideGlitchDetailsModal);
    }

    populateGlitchesGrid();
}

function showGlitchDetailsModal(glitch) {
    if (!modal || !glitch) return;
    
    modalTitle.textContent = glitch.name;
    corruptedName.textContent = glitch.name;
    purifiedName.textContent = glitch.purifiedName;
    corruptedImg.src = glitch.image;
    purifiedImg.src = glitch.purifiedImage;
    descriptionEl.textContent = glitch.description;
    
    modal.style.display = 'flex';
}

function hideGlitchDetailsModal() {
    if (modal) {
        modal.style.display = 'none';
    }
}

function createGlitchCard(glitch) {
    const card = document.createElement('div');
    card.className = 'glitch-card';
    card.innerHTML = `
        <div class="glitch-card-image-container">
            <img src="${glitch.image}" alt="${glitch.name}" class="glitch-card-image">
        </div>
        <div class="glitch-card-info">
            <h3>${glitch.name}</h3>
            <p class="description">${glitch.description}</p>
            <div class="glitch-stats">
                 <p><strong>Threat Level:</strong> ${glitch.threat}</p>
                 <p><strong>Location:</strong> ${glitch.location}</p>
            </div>
        </div>
    `;

    card.addEventListener('click', () => showGlitchDetailsModal(glitch));

    return card;
}

function populateGlitchesGrid() {
    const grid = document.getElementById('glitches-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear previous content

    Object.values(GLITCH_DATA).forEach(glitch => {
        const card = createGlitchCard(glitch);
        grid.appendChild(card);
    });
}