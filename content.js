console.log("LeetCode AI Agent Content Script Loaded (v2 CSP Fix)");

// ==================== Floating Button Widget ====================
function createFloatingButton() {
    // Remove existing if any (useful for reloads)
    const existing = document.getElementById('leetcode-ai-fab');
    if (existing) existing.remove();

    const fab = document.createElement('button');
    fab.id = 'leetcode-ai-fab';
    fab.innerHTML = '🤖';
    fab.title = 'Open AI Helper';

    // Styles
    fab.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        font-size: 24px;
        z-index: 999999;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    `;

    fab.addEventListener('mouseenter', () => {
        fab.style.transform = 'scale(1.1)';
        fab.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    fab.addEventListener('mouseleave', () => {
        fab.style.transform = 'scale(1)';
        fab.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    fab.addEventListener('click', () => {
        // Send message to background to open the side panel
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
    });

    document.body.appendChild(fab);
}

// Attempt to create immediately, but also wait for body
if (document.body) {
    createFloatingButton();
} else {
    window.addEventListener('DOMContentLoaded', createFloatingButton);
}


// ==================== Problem Data Extraction ====================
async function getProblemData() {
    // Helper to find by likely metadata/structure rather than brittle paths
    // LeetCode problems usually have a Title near the top left and a Description container.

    // Strategy 1: Look for specific meta tags or JSON-LD (LeetCode often has this)
    // Strategy 2: Look for common classes. 

    // Attempting to find the description container
    const descriptionSelectors = [
        '[data-track-load="description_content"]',
        '.elfjS', // Obfuscated class seen in some versions
        'div[class*="description"]',
        '#description'
    ];

    // Attempting to find title
    const titleSelectors = [
        'div[class*="title"] a',
        'span[class*="title"]',
        'div.flex.items-start.gap-2 > div > a'
    ];

    const findElement = (selectors) => {
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    };

    let title = "Unknown Title";
    let description = "Could not find description.";

    const titleEl = findElement(titleSelectors);
    if (titleEl) title = titleEl.innerText;
    else title = document.title.split('-')[0].trim(); // Fallback to page title

    const descEl = findElement(descriptionSelectors);
    if (descEl) description = descEl.innerText;

    // Retry logic if description is empty (might be loading)
    if (!descEl || description.length < 50) {
        console.log("Waiting for description to load...");
        // Wait for 2 seconds and try again
        await new Promise(r => setTimeout(r, 2000));
        const retryDescEl = findElement(descriptionSelectors);
        if (retryDescEl) description = retryDescEl.innerText;
    }

    return {
        title: title,
        description: description,
        url: window.location.href
    };
}

// ==================== Monaco Editor Interaction ====================
// We need to inject scripts to access the 'monaco' global object which is not available to content scripts directly.




// ==================== Monaco Editor Interaction (CSP Safe) ====================

// Inject the separate script file (web_accessible_resource)
function injectScriptFile() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// Inject immediately
injectScriptFile();

// Helper to get Editor Context (Language + Code)
function getEditorContext() {
    return new Promise((resolve) => {
        const requestId = 'req_' + Date.now();

        const listener = (event) => {
            if (event.source !== window || !event.data || event.data.type !== 'LC_AGENT_CONTEXT_RESPONSE') return;
            if (event.data.requestId !== requestId) return;

            window.removeEventListener('message', listener);
            resolve(event.data.payload);
        };

        window.addEventListener('message', listener);

        // Request context from injected script
        window.postMessage({ type: 'LC_AGENT_GET_CONTEXT', requestId: requestId }, '*');

        // Timeout
        setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve({ language: 'unknown', currentCode: '' });
        }, 1000);
    });
}

function insertCodeIntoEditor(code) {
    window.postMessage({ type: 'LC_AGENT_INSERT_CODE', code: code }, '*');
}


// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProblemContext") {
        // Collect: DOM Data + Editor Data
        Promise.all([getProblemData(), getEditorContext()]).then(([domData, editorData]) => {
            sendResponse({
                ...domData,
                language: editorData.language,
                currentCode: editorData.currentCode
            });
        });
        return true; // Async response
    }

    if (request.action === "insertCode") {
        insertCodeIntoEditor(request.code);
    }

    return true;
});
