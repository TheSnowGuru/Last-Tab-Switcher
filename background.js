// Object to hold tab history and current position per window
let tabHistoryWithPosition = {};

// Function to save the current tab to history, with adjustments to avoid issues when navigating back
function saveTabToHistory(windowId, tabId, isNavigatingBack = false) {
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
    let windowHistory = result.tabHistoryWithPosition[windowId.toString()] || { currentPosition: -1, history: [] };
    if (!isNavigatingBack) {
      // Add new tabId to history only if not navigating back
      if (windowHistory.currentPosition < windowHistory.history.length - 1) {
        // Truncate history if going back then opening a new tab
        windowHistory.history = windowHistory.history.slice(0, windowHistory.currentPosition + 1);
      }
      windowHistory.history.push(tabId);
      windowHistory.currentPosition = windowHistory.history.length - 1; // Update currentPosition to new tab
    } // No else, we don't update history if navigating back

    // Ensure history doesn't exceed 10 tabs
    if (windowHistory.history.length > 10) {
      windowHistory.history.shift();
      windowHistory.currentPosition--;
    }

    result.tabHistoryWithPosition[windowId.toString()] = windowHistory;
    chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
  });
}

// Navigate back in history on command or icon click
function navigateBackInHistory(windowId) {
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
    let windowHistory = result.tabHistoryWithPosition[windowId.toString()];
    if (windowHistory && windowHistory.currentPosition > 0) {
      windowHistory.currentPosition--; // Move back in history
      const lastTabId = windowHistory.history[windowHistory.currentPosition];

      chrome.tabs.update(lastTabId, {active: true}, () => {
        if (chrome.runtime.lastError) {
          console.error("Error activating tab:", chrome.runtime.lastError);
        } else {
          // When navigating back, no need to call saveTabToHistory here
          // Directly update the storage to ensure currentPosition is correctly set
          chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
        }
      });
    }
  });
}

// Listen to tab activation to update history accordingly
chrome.tabs.onActivated.addListener(activeInfo => {
  saveTabToHistory(activeInfo.windowId, activeInfo.tabId);
});

// Listen for commands (e.g., keyboard shortcuts)
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "switch_to_last_tab") {
    navigateBackInHistory(tab.windowId);
  }
});

// Listen for the browser action icon click
chrome.action.onClicked.addListener((tab) => {
  navigateBackInHistory(tab.windowId);
});
