let tabHistory = []; // Track tab visit history

chrome.tabs.onActivated.addListener(activeInfo => {
  // Move the newly activated tab ID to the end of the history array
  tabHistory = tabHistory.filter(id => id !== activeInfo.tabId);
  tabHistory.push(activeInfo.tabId);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch_to_last_tab" && tabHistory.length > 1) {
    // Switch to the second last tab in history, which is the last visited
    let lastVisitedTabId = tabHistory[tabHistory.length - 2];
    chrome.tabs.update(lastVisitedTabId, {active: true});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove closed tabs from history
  tabHistory = tabHistory.filter(id => id !== tabId);
});
