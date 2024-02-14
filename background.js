// Background script for Chrome Extension

// Object to hold tab history per window, each with a maximum of 10 entries
const tabHistoryPerWindow = {};

// Listen for tab activation to update history
chrome.tabs.onActivated.addListener(activeInfo => {
    updateTabHistory(activeInfo.tabId, activeInfo.windowId);
});

// Listen for tab closure to remove it from history
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabHistoryPerWindow[removeInfo.windowId]) {
        const index = tabHistoryPerWindow[removeInfo.windowId].indexOf(tabId);
        if (index > -1) {
            tabHistoryPerWindow[removeInfo.windowId].splice(index, 1);
        }
    }
});

// Function to update tab history
function updateTabHistory(tabId, windowId) {
    if (!tabHistoryPerWindow[windowId]) {
        tabHistoryPerWindow[windowId] = [];
    }

    const history = tabHistoryPerWindow[windowId];
    const existingIndex = history.indexOf(tabId);

    // Remove tabId if it exists to re-add it at the end
    if (existingIndex > -1) {
        history.splice(existingIndex, 1);
    }

    // Add tabId to the end and ensure history does not exceed 10 tabs
    history.push(tabId);
    if (history.length > 10) {
        history.shift(); // Remove the oldest tab
    }
}

// Command listener for switching to the last tab
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "switch_to_last_tab") {
        const windowId = tab.windowId;
        if (tabHistoryPerWindow[windowId] && tabHistoryPerWindow[windowId].length > 1) {
            const lastTabIndex = tabHistoryPerWindow[windowId].length - 2; // Second to last index
            const lastTabId = tabHistoryPerWindow[windowId][lastTabIndex];
            chrome.tabs.update(lastTabId, { active: true });
        }
    }
});

// Click on extension icon to switch to the last tab
chrome.action.onClicked.addListener((tab) => {
    const windowId = tab.windowId;
    if (tabHistoryPerWindow[windowId] && tabHistoryPerWindow[windowId].length > 1) {
        const lastTabIndex = tabHistoryPerWindow[windowId].length - 2; // Second to last index
        const lastTabId = tabHistoryPerWindow[windowId][lastTabIndex];
        chrome.tabs.update(lastTabId, { active: true });
    }
});
