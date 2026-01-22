// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);
    // Enables the side panel on leetcode.com
    if (url.origin === 'https://leetcode.com') {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    } else {
        // Disables the side panel on other sites
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});

// Listen for messages from content script (floating button)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSidePanel') {
        chrome.sidePanel.open({ tabId: sender.tab.id });
    }
});
