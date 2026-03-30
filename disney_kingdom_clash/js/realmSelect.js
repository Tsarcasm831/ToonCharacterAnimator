import { LEVEL_DATA } from './data/levelData.js';
import * as GameState from './gameState.js';
import { isStageCompleted, isRealmUnlocked, getCurrentUser } from './utils/user.js';
import { UI_IMAGE_PATH } from './constants.js';

let onRealmSelectCallback;

export function initRealmSelect(onSelect) {
    onRealmSelectCallback = onSelect;
}

export function renderRealmSelectScreen() {
    const grid = document.getElementById('realm-selection-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear previous content

    Object.values(LEVEL_DATA).forEach(level => {
        const unlocked = isRealmUnlocked(level.id);
        const card = createRealmCard(level, unlocked);
        grid.appendChild(card);
    });
}

function createRealmCard(level, unlocked) {
    const user = getCurrentUser();
    const card = document.createElement('div');
    card.className = 'realm-card';
    if (!unlocked) {
        card.classList.add('locked');
    }

    // Calculate progress
    const realmTrophies = user.trophiesByRealm[level.id] || 0;
    const maxTrophies = level.stages.reduce((sum, stage) => sum + stage.trophyReward, 0);
    const progressPercent = maxTrophies > 0 ? Math.min(100, Math.round((realmTrophies / maxTrophies) * 100)) : 0;

    let contentHTML = '';

    if (unlocked) {
        let stagesHTML = level.stages.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.id);
            // Stage is unlocked if it's the first one, or the previous one is completed.
            const isStageUnlocked = index === 0 || isStageCompleted(level.stages[index - 1]?.id);
            const buttonClass = `stage-button ${isCompleted ? 'completed' : ''} ${!isCompleted && isStageUnlocked ? 'current' : ''}`;
            
            return `
                <button class="${buttonClass}" data-stage-id="${stage.id}" ${!isStageUnlocked ? 'disabled' : ''} title="${stage.name}">
                    ${isCompleted ? '&#10003;' : index + 1}
                </button>
            `;
        }).join('<div class="stage-connector"></div>'); // Add connector div between buttons

        contentHTML = `
            <div class="realm-stats">
                <div class="stat-row">
                    <img src="${UI_IMAGE_PATH}/trophy_icon.png" class="icon-small" alt="Trophies">
                    <span class="trophy-count">${realmTrophies} / ${maxTrophies}</span>
                </div>
                <div class="realm-progress-track">
                    <div class="realm-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            <div class="stages-scroll-container">
                <div class="stages-track">
                    ${stagesHTML}
                </div>
            </div>
        `;
    } else {
        contentHTML = `
            <div class="locked-content">
                <div class="lock-icon-wrapper">
                    <img src="${UI_IMAGE_PATH}/lock_icon.png" class="lock-icon" alt="Locked">
                </div>
                <div class="lock-requirement">
                    <span>Requires</span>
                    <div class="req-value">
                        <img src="${UI_IMAGE_PATH}/trophy_icon.png" alt="Trophy">
                        <span>${level.trophyRequirement}</span>
                    </div>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="realm-card-header" style="background-image: url('${level.background}')">
            <div class="realm-header-overlay"></div>
            <h3 class="realm-title">${level.name}</h3>
        </div>
        <div class="realm-card-body">
            <p class="realm-description">${level.description}</p>
            ${contentHTML}
        </div>
    `;

    if (unlocked) {
        card.addEventListener('click', (e) => {
            const btn = e.target.closest('.stage-button');
            if (btn && !btn.disabled) {
                const stageId = btn.dataset.stageId;
                const stageData = level.stages.find(s => s.id === stageId);
                if (stageData) {
                    GameState.setSelectedLevel(stageData, level); // Pass both stage and parent realm data
                    if (onRealmSelectCallback) {
                        onRealmSelectCallback();
                    }
                }
            }
        });
    }

    return card;
}