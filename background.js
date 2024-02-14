// Background script for Chrome Extension

// Object to hold tab history and current position per window
const tabHistoryWithPosition = {};

// Update tab history and reset position on tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
        const {tabHistoryWithPosition} = result;
        const windowId = activeInfo.windowId.toString(); // Ensure windowId is a string for consistency

        if (!tabHistoryWithPosition[windowId]) {
            tabHistoryWithPosition[windowId] = {history: [], currentPosition: -1};
        }

        // Update history, ensuring no duplicates and updating current position
        updateHistoryAndPosition(tabHistoryWithPosition[windowId], activeInfo.tabId);

        chrome.storage.local.set({tabHistoryWithPosition});
    });
});

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
          // Decrement the current position to move back in history
          windowHistory.currentPosition--;

          // If the currentPosition now points to a tab that's no longer active, move back again
          while (windowHistory.currentPosition > 0 && !windowHistory.history.includes(windowHistory.history[windowHistory.currentPosition])) {
              windowHistory.currentPosition--;
          }

          const lastTabId = windowHistory.history[windowHistory.currentPosition];
          chrome.tabs.get(lastTabId, (tab) => {
              if (chrome.runtime.lastError) {
                  // If the tab doesn't exist anymore, adjust the history and try again
                  windowHistory.history.splice(windowHistory.currentPosition, 1); // Remove the non-existent tab from history
                  if (windowHistory.currentPosition > 0) {
                      windowHistory.currentPosition--; // Adjust position to account for the removed tab
                  }
                  chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition}); // Save updated history
                  navigateBackInHistory(windowId); // Retry navigation
              } else {
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
