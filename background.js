let tabHistory = {}; // Track tab visit history per window

// Update tab history when a tab is activated
chrome.tabs.onActivated.addListener(activeInfo => {
  // Get the window ID to manage history per window
  chrome.windows.getCurrent({populate: true}, currentWindow => {
    if (!tabHistory[currentWindow.id]) {
      tabHistory[currentWindow.id] = [];
    }
    // Move the newly activated tab ID to the end of the history array for the current window
    tabHistory[currentWindow.id] = tabHistory[currentWindow.id].filter(id => id !== activeInfo.tabId);
    tabHistory[currentWindow.id].push(activeInfo.tabId);
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch_to_last_tab") {
    chrome.windows.getCurrent({populate: true}, currentWindow => {
      let windowHistory = tabHistory[currentWindow.id] || [];
      if (windowHistory.length > 1) {
        // Switch to the second last tab in history, which is the last visited for the current window
        let lastVisitedTabId = windowHistory[windowHistory.length - 2];
        chrome.tabs.update(lastVisitedTabId, {active: true});
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
