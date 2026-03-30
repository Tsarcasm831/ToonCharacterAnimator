import { marked } from 'marked';

export async function initChangelog() {
    const changelogButton = document.getElementById('changelog-button');
    const versionTag = document.getElementById('version-tag');
    const closeButton = document.getElementById('changelog-close-button');
    const modal = document.getElementById('changelog-modal');

    if (changelogButton) {
        changelogButton.addEventListener('click', showChangelog);
    }
    if (versionTag) {
        versionTag.addEventListener('click', showChangelog);
    }
    if (closeButton) {
        closeButton.addEventListener('click', hideChangelog);
    }

    document.querySelectorAll('#changelog-modal .tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('changelog-modal');
            if (!modal) return;
            const tabId = button.dataset.tab;
            modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            const pane = modal.querySelector(`#${tabId}-tab`);
            if (pane) pane.classList.add('active');
        });
    });
}

async function showChangelog() {
    const modal = document.getElementById('changelog-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    const latestContainer = document.getElementById('latest-tab');
    const olderContainer = document.getElementById('older-tab');
    const archiveContainer = document.getElementById('archive-tab');
    if (!latestContainer || !olderContainer || !archiveContainer) return;

    latestContainer.innerHTML = '<p>Loading...</p>';
    olderContainer.innerHTML = '<p>Loading...</p>';
    archiveContainer.innerHTML = '<p>Loading...</p>';

    try {
        const [currentResp, archiveResp] = await Promise.all([
            fetch('./changelog.md'),
            fetch('./changelog-archive.md')
        ]);

        const currentMarkdown = currentResp.ok ? await currentResp.text() : '';
        const archiveMarkdown = archiveResp.ok ? await archiveResp.text() : '';

        const [latestMarkdown, olderMarkdown] = splitChangelog(currentMarkdown);

        latestContainer.innerHTML = latestMarkdown
            ? marked.parse(latestMarkdown)
            : '<p>Could not load changelog.</p>';

        olderContainer.innerHTML = olderMarkdown
            ? marked.parse(olderMarkdown)
            : '';

        archiveContainer.innerHTML = archiveMarkdown
            ? marked.parse(archiveMarkdown)
            : '';

    } catch (error) {
        latestContainer.innerHTML = '<p>Could not load changelog.</p>';
        olderContainer.innerHTML = '';
        archiveContainer.innerHTML = '';
        console.error('Failed to load changelog:', error);
    }
}

function splitChangelog(markdown) {
    const text = markdown.replace(/^#.*\n/, '').trim();
    const secondIndex = text.indexOf('\n## ', text.indexOf('## ') + 1);
    if (secondIndex !== -1) {
        return [text.slice(0, secondIndex), text.slice(secondIndex)];
    }
    return [text, ''];
}

function hideChangelog() {
    const modal = document.getElementById('changelog-modal');
    if (modal) {        modal.style.display = 'none';
    }
}
