// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const explainBtn = document.getElementById('explain-btn');

// Configuration (Hardcoded)
// Configuration
let apiKey = '';
const selectedModel = 'moonshotai/kimi-k2:free';

// State
let problemContext = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await refreshContext();
});

// Settings Logic
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-settings-modal') || document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const apiKeyInput = document.getElementById('api-key-input');

settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = apiKey;
    settingsModal.style.display = 'flex';
});

cancelSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

saveSettingsBtn.addEventListener('click', async () => {
    const newKey = apiKeyInput.value.trim();

    if (!newKey) {
        alert('Please enter an API Key');
        return;
    }

    await chrome.storage.local.set({
        openRouterApiKey: newKey
    });

    apiKey = newKey;

    settingsModal.style.display = 'none';
    addSystemMessage('Settings saved!');
});

async function loadSettings() {
    const data = await chrome.storage.local.get(['openRouterApiKey']);
    if (data.openRouterApiKey) {
        apiKey = data.openRouterApiKey;
    }
}

// Chat Logic
sendBtn.addEventListener('click', () => sendMessage());

if (explainBtn) {
    explainBtn.addEventListener('click', () => {
        explainBtn.style.display = 'none';
        sendMessage("Explain this question to me like you're teaching a class. Start with the intuition and a dry run example, effectively 'visualizing' the algorithm textually. Do not give the full code yet, just the logic.");
    });
}

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage(manualText = null) {
    const text = manualText || userInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    if (!manualText) userInput.value = '';

    if (!apiKey) {
        addSystemMessage("Please set your OpenRouter API Key in Settings (⚙️) to continue.");
        return;
    }

    // Refresh context if missing
    if (!problemContext) {
        await refreshContext();
        if (!problemContext) {
            // Try one more time with a small delay for dynamic content
            await new Promise(r => setTimeout(r, 1000));
            await refreshContext();
        }
    }

    // Add loading indicator
    const loadingId = addSystemMessage('Thinking...', true);

    try {
        const response = await callOpenRouter(text);
        removeMessage(loadingId);

        // Start typing animation
        await typeMessage(response, 'assistant');

    } catch (error) {
        removeMessage(loadingId);
        addSystemMessage('Error: ' + error.message);
    }
}

async function callOpenRouter(userMessage) {
    const systemPrompt = `You are an expert software engineer and LeetCode coach. 
    Your goal is to help the user solve the current problem.
    
    Current Problem Context:
    Title: ${problemContext?.title || 'Unknown'}
    Description: ${problemContext?.description || 'Not available'}
    Language: ${problemContext?.language || 'Unknown'}
    Current Code: 
    ${problemContext?.currentCode || 'Not available'}
    
    Guidelines:
    - START with a dry run or example walk-through to build intuition.
    - VISUALIZE the logic textually (e.g., "Step 1: We look at index 0...").
    - DO NOT provide the full solution code immediately unless explicitly asked for "CODE".
    - If explaining, focus on the "WHY" and "HOW".
    - Finally, after the explanation, offer to provide the code.
    - Be modern, friendly, and concise. use emojis occasionally.
    - Format output nicely with Bold headers and bullet points.
    - IMPORTANT: If code is provided, MUST be in the '${problemContext?.language || 'users selected'}' language.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": selectedModel,
            "messages": [
                { "role": "system", "content": systemPrompt },
                { "role": "user", "content": userMessage }
            ]
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API Key. Please check your settings.');
        }
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Context Management
async function refreshContext() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        if (!tab.url.includes('leetcode.com/problems')) return;

        const response = await chrome.tabs.sendMessage(tab.id, { action: "getProblemContext" });
        if (response) {
            problemContext = response;
            console.log('Context loaded:', problemContext.title, 'Language:', problemContext.language);
        }
    } catch (e) {
        console.log('Could not fetch context:', e);
    }
}

// UI Helpers
function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.id = 'msg-' + Date.now();
    div.innerText = text; // Assistants handled by typeMessage, users here
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return div.id;
}

function addSystemMessage(text, returnId = false) {
    const div = document.createElement('div');
    div.className = 'message system';
    div.innerText = text;
    div.id = 'msg-' + Date.now();
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (returnId) return div.id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Typing Animation
async function typeMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role} typing-cursor`;
    chatContainer.appendChild(div);

    let index = 0;
    const speed = 5; // Faster speed

    await new Promise(resolve => {
        const interval = setInterval(() => {
            div.innerText += text.charAt(index);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            index++;
            if (index >= text.length) {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });

    div.classList.remove('typing-cursor');
    if (role === 'assistant') {
        div.innerHTML = parseMarkdown(text);
    }
}

// Markdown Parser & Copy Code
function parseMarkdown(text) {
    const codeBlocks = [];

    // 1. Extract Code Blocks and replace with placeholders
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let processedText = text.replace(codeBlockRegex, (match, lang, code) => {
        lang = lang || 'text';
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`
            <div class="code-block-wrapper">
                <div class="code-header">
                    <span>${lang}</span>
                    <div class="code-actions">
                        <button class="copy-btn">Copy</button>
                        <button class="insert-btn">Insert</button>
                    </div>
                </div>
                <pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>
            </div>
        `);
        return placeholder;
    });

    // 2. Inline Code: `...`
    processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Headers: ### Title -> Big Bold Text with bullet
    processedText = processedText.replace(/^(#{1,6})\s+(.+)$/gm, '<div class="topic-header">$2</div>');

    // 4. Separators: --- -> Line
    processedText = processedText.replace(/^\s*---\s*$/gm, '<hr class="section-divider">');

    // 5. Bold: **...**
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 6. Line Breaks -> <br> 
    processedText = processedText.replace(/\n/g, '<br>');

    // 7. Restore Code Blocks
    codeBlocks.forEach((html, index) => {
        const placeholder = `__CODE_BLOCK_${index}__`;
        // We generally don't want the placeholder wrapped in <br>, so we might need to be careful.
        // But since we just did replace(/\n/g, '<br>'), the placeholder line itself might have stuck <br>s around it if it was on its own line.
        // Actually, the placeholder replaced the whole ```...``` block.
        // If the original text had newlines around it, they are preserved in processedText.
        // Let's replace the placeholder (and potentially adjacent <br>s if we want to be clean, but simple replacement is safer).

        // Note: The previous logic logic split by wrapper to avoid <br> in code.
        // Here, the placeholder is just text. The code block HTML itself DOES NOT contain newlines we want to convert to <br> (it's already HTML).
        // So we can just swap back.
        processedText = processedText.replace(placeholder, html);
    });

    return processedText;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global Event Delegation for Dynamic Content
document.addEventListener('click', async (e) => {
    // Copy Button
    if (e.target.classList.contains('copy-btn')) {
        const btn = e.target;
        const pre = btn.closest('.code-block-wrapper').querySelector('pre code');
        const code = pre.innerText;

        try {
            await navigator.clipboard.writeText(code);
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = originalText, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            btn.innerText = 'Error';
        }
    }

    // Insert Button
    if (e.target.classList.contains('insert-btn')) {
        const btn = e.target;
        const pre = btn.closest('.code-block-wrapper').querySelector('pre code');
        const code = pre.innerText;

        // Disable temporarily
        btn.disabled = true;
        btn.innerText = 'Inserting...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, { action: "insertCode", code: code });
                btn.innerText = 'Inserted!';
            } else {
                btn.innerText = 'Failed';
            }
        } catch (err) {
            console.error('Failed to insert code:', err);
            btn.innerText = 'Error';
        }

        setTimeout(() => {
            btn.innerText = 'Insert';
            btn.disabled = false;
        }, 2000);
    }
});
