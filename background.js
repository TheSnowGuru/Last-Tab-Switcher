let tabHistory = {}; // Track tab visit history per window, storing the last 10 tabs

// Update tab history when a tab is activated
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.windows.getCurrent({populate: true}, currentWindow => {
    const windowId = currentWindow.id;
    if (!tabHistory[windowId]) {
      tabHistory[windowId] = [];
    }
    // Move the newly activated tab ID to the end of the history array for the current window
    tabHistory[windowId] = tabHistory[windowId].filter(id => id !== activeInfo.tabId);
    tabHistory[windowId].push(activeInfo.tabId);

    // Ensure the history doesn't exceed 10 tabs
    if (tabHistory[windowId].length > 10) {
      tabHistory[windowId].shift(); // Remove the oldest tab to maintain a maximum of 10
    }
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch_to_last_tab") {
    chrome.windows.getCurrent({populate: true}, currentWindow => {
      const windowId = currentWindow.id;
      let windowHistory = tabHistory[windowId] || [];
      if (windowHistory.length > 1) {
        // Ensure we don't try to switch to a non-existent tab (in case it was closed)
        let indexToSwitch = windowHistory.length - 2; // Second last tab
        let lastVisitedTabId = windowHistory[indexToSwitch];
        chrome.tabs.update(lastVisitedTabId, {active: true}, () => {
          if (chrome.runtime.lastError && windowHistory.length > 2) {
            // If the tab could not be found (it might have been closed), try the next one
            tabHistory[windowId].splice(indexToSwitch, 1); // Remove the non-existent tab
            chrome.commands.update({active: true}); // Attempt to switch again
          }
        });
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Remove closed tabs from history and handle per window
  if (tabHistory[removeInfo.windowId]) {
    tabHistory[removeInfo.windowId] = tabHistory[removeInfo.windowId].filter(id => id !== tabId);
  }
});

chrome.windows.onRemoved.addListener(windowId => {
  // Clean up history for closed windows to prevent memory leaks
  delete tabHistory[windowId];
});
