chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(['isOpen', 'windowId'], (result) => {
        let isOpen = result.isOpen;
        let windowId = result.windowId;

        const targetUrl = chrome.runtime.getURL("/popup.html");

        if (isOpen && windowId) {
            // If the window is already open, just focus it
            chrome.windows.update(windowId, { focused: true });
        } else {
            // If not open, create a new popup window
            chrome.windows.create({
                url: targetUrl,
                type: "popup",
                width: 398,
                height: 450
            }, (newWindow) => {
                chrome.storage.local.set({ isOpen: true, windowId: newWindow.id });
            });
        }
    });
});

chrome.windows.onRemoved.addListener((id) => {
    chrome.storage.local.get('windowId', (result) => {
        if (result.windowId === id) {
            chrome.storage.local.set({ isOpen: false, windowId: null });
        }
    });
});

if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}