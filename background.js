// Background script for Chrome Extension
// Function to save the current tab to history
function saveTabToHistory(windowId, tabId) {
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
    let windowHistory = result.tabHistoryWithPosition[windowId.toString()] || { currentPosition: 0, history: [] };
    windowHistory.history.push(tabId);
    windowHistory.currentPosition++;
    result.tabHistoryWithPosition[windowId.toString()] = windowHistory;
    chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
  });
}

// Object to hold tab history and current position per window
const tabHistoryWithPosition = {};
// Navigate back in history on command or icon click
function navigateBackInHistory(windowId) {
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
      const windowHistory = result.tabHistoryWithPosition[windowId.toString()];
      if (windowHistory && windowHistory.currentPosition > 0) {
          const lastTabId = windowHistory.history[windowHistory.currentPosition - 1];
          saveTabToHistory(windowId, lastTabId); // Save the current tab to history
          chrome.tabs.get(lastTabId, (tab) => {
              if (!chrome.runtime.lastError) {
                  // Tab exists, activate it
                  chrome.tabs.update(lastTabId, {active: true});
                  // Save the updated position after successful navigation
                  chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
              }
          });
      }
  });
}


// Update tab history and reset position on tab activation
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
        const {tabHistoryWithPosition} = result;
        const windowId = removeInfo.windowId.toString(); // Ensure windowId is a string for consistency

        if (!tabHistoryWithPosition[windowId]) {
            tabHistoryWithPosition[windowId] = {history: [], currentPosition: -1};
        }

        // Update history, ensuring no duplicates and updating current position
        updateHistoryAndShiftPosition(tabHistoryWithPosition[windowId], tabId);

        chrome.storage.local.set({tabHistoryWithPosition});
    });
});

function updateHistoryAndShiftPosition(tabHistory, removedTabId) {
    const index = tabHistory.history.indexOf(removedTabId);
    if (index !== -1) {
        tabHistory.history.splice(index, 1);
        if (index <= tabHistory.currentPosition) {
            tabHistory.currentPosition--;
        }
        chrome.storage.local.set({tabHistoryWithPosition});
    }
}

function updateHistoryAndPosition(windowHistory, tabId) {
    // Remove tabId if it exists to prevent duplicates
    const index = windowHistory.history.indexOf(tabId);
    if (index > -1) {
        windowHistory.history.splice(index, 1);
    }
    // Add tabId to the end and update currentPosition to the last
    windowHistory.history.push(tabId);
    windowHistory.currentPosition = windowHistory.history.length - 1;

    // Ensure the history doesn't exceed 10 tabs
    if (windowHistory.history.length > 10) {
        windowHistory.history.shift();
        windowHistory.currentPosition--;
    }
}

// Navigate back in history on command or icon click
function navigateBackInHistory(windowId) {
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
      const windowHistory = result.tabHistoryWithPosition[windowId.toString()];
      if (windowHistory && windowHistory.currentPosition > 0) {
          const lastTabId = windowHistory.history[windowHistory.currentPosition - 1];
          chrome.tabs.get(lastTabId, (tab) => {
              if (!chrome.runtime.lastError) {
                  // Tab exists, activate it
                  chrome.tabs.update(lastTabId, {active: true});
                  // Save the updated position after successful navigation
                  chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
              }
          });
      }
  });
}


chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "switch_to_last_tab") {
        navigateBackInHistory(tab.windowId);
    }
});

chrome.action.onClicked.addListener((tab) => {
    navigateBackInHistory(tab.windowId);
});
