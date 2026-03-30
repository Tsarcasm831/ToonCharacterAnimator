import { UI_IMAGE_PATH } from '../constants.js';

const particlesHTML = Array.from({ length: 20 }).map((_, i) => 
    `<div class="particle particle-${i}"></div>`
).join('');

export const menuScreenHTML = `
<div id="menu-screen">
    <div class="particles-container">${particlesHTML}</div>
    
    <div class="title-wrapper">
        <h1 class="game-title">Disney Kingdom Clash</h1>
        <p class="game-subtitle">Restore the Magic</p>
    </div>

    <div class="menu-buttons">
        <button id="play-button" class="menu-btn primary-btn">
            <div class="btn-content">
                <img src="${UI_IMAGE_PATH}/crossed_swords_icon.png" alt="Play">
                <span>Enter Realm</span>
            </div>
            <div class="btn-shine"></div>
        </button>
        
        <div class="secondary-row">
            <button id="instructions-button" class="menu-btn secondary-btn">
                <div class="btn-content">
                    <img src="${UI_IMAGE_PATH}/reward_scroll.png" alt="Help">
                    <span>Guide</span>
                </div>
            </button>
            <button id="options-button" class="menu-btn secondary-btn">
                <div class="btn-content">
                    <img src="${UI_IMAGE_PATH}/gear_icon.png" alt="Options">
                    <span>Options</span>
                </div>
            </button>
        </div>

        <div class="split-support-button">
            <div class="split-support-button-text">Support the Dev</div>
            <a href="https://www.paypal.com/ncp/payment/4ZHFHWD5AA5F2" target="_blank" class="support-link-paypal" title="Support via PayPal">
                <img src="./assets/images/ui/paypal_logo.png" alt="PayPal" class="support-icon">
            </a>
            <a href="https://venmo.com/u/Anton-Vasilyev-1" target="_blank" class="support-link-venmo" title="Support via Venmo">
                <img src="./assets/images/ui/venmo_logo.png" alt="Venmo" class="support-icon">
            </a>
        </div>
    </div>
    <div class="footer-info">
        <div id="version-tag" class="version-tag" title="View Changelog">v0.7.9.9</div>
    </div>
</div>
`;