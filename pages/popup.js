const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = chrome || (isFirefox && browser);

browser.windows.create({
    type: "popup",
    url: "popup.html",
    width: (screen.width / 1.5),
    height: (screen.height / 3),
    left: (screen.width / 2) - ((screen.width / 1.5) / 2),
    top: (screen.height / 2) - ((screen.height / 3) / 2),
});