// This script is injected into the webpage to access the 'window.monaco' object
console.log('LeetCode Agent: Injected script loaded');

// Communication Bridge
window.addEventListener('message', (event) => {
    // Only accept messages from the content script (we use a specific prefix or check origin if needed)
    // Here we just check the data structure
    if (event.source !== window || !event.data || !event.data.type) return;

    if (event.data.type === 'LC_AGENT_INSERT_CODE') {
        insertCode(event.data.code);
    }

    if (event.data.type === 'LC_AGENT_GET_CONTEXT') {
        sendContext(event.data.requestId);
    }
});

function insertCode(code) {
    try {
        const socket = window.monaco?.editor?.getModels()?.[0];
        if (socket) {
            socket.setValue(code);
            console.log('LeetCode Agent: Code inserted');
        } else {
            console.error('LeetCode Agent: Monaco editor not found');
        }
    } catch (e) {
        console.error('LeetCode Agent: Insertion failed', e);
    }
}

function sendContext(requestId) {
    try {
        const model = window.monaco?.editor?.getModels()?.[0];
        const lang = model?.getLanguageId() || 'unknown';
        const code = model?.getValue() || '';

        window.postMessage({
            type: 'LC_AGENT_CONTEXT_RESPONSE',
            requestId: requestId,
            payload: {
                language: lang,
                currentCode: code
            }
        }, '*');

    } catch (e) {
        console.error('LeetCode Agent: Failed to read context', e);
        window.postMessage({
            type: 'LC_AGENT_CONTEXT_RESPONSE',
            requestId: requestId,
            payload: { language: 'unknown', currentCode: '' }
        }, '*');
    }
}
