// Background script for Chrome Extension
// Function to save the current tab to history
function saveTabToHistory(windowId, tabId, openedUsingShortcut) {
  if (openedUsingShortcut) {
    // Do not save the tab into history if opened using shortcut
    // Implement the logic to open the tab in a specific slot based on history
    // Check if there are already 10 slots filled in the history
    // If there are 10 slots filled, do not update any slot
    // Otherwise, open the tab in a specific slot
  }
  chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
    let windowHistory = result.tabHistoryWithPosition[windowId.toString()] || { currentPosition: 0, history: [] };
    if (!openedUsingShortcut && windowHistory.history.length < 10) {
      windowHistory.history.push(tabId);
      windowHistory.currentPosition++;
    }
    result.tabHistoryWithPosition[windowId.toString()] = windowHistory;
    chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
  });
}

// Object to hold tab history and current position per window
const tabHistoryWithPosition = {};
// Navigate back in history on command or icon click
// Corrected function to navigate back in history
function navigateBackInHistory(windowId) {
    chrome.storage.local.get({tabHistoryWithPosition: {}}, (result) => {
      let windowHistory = result.tabHistoryWithPosition[windowId.toString()];
      if (windowHistory && windowHistory.currentPosition > 1) { // Adjusted to > 1 to properly navigate back
        windowHistory.currentPosition -= 2; // Move back by two to account for the current and previous tab
        const lastTabId = windowHistory.history[windowHistory.currentPosition];
        chrome.tabs.update(lastTabId, {active: true}, () => {
          if (chrome.runtime.lastError) {
            console.error("Error activating tab:", chrome.runtime.lastError);
          } else {
            // Successfully navigated back, update storage
            chrome.storage.local.set({tabHistoryWithPosition: result.tabHistoryWithPosition});
          }
        });
      }
    });
  }
  
  // Adjust saveTabToHistory to properly handle openedUsingShortcut if necessary
  // Ensure that the logic aligns with the intended behavior, especially regarding the interaction with navigateBackInHistory.
  


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
      if (windowHistory && windowHistory.currentPosition > 0 && !windowHistory.fromExtension) {
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
