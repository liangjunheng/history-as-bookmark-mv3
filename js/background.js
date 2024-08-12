const jsFiles = ['common.js', 'bookmarks.js','omnibox.js'];
for (const file of jsFiles) {
  importScripts(file);
}

///////////// This code is used to solve the Chrome Bug --- Start /////////////
const keepAlive = () => setInterval(browser.runtime.getPlatformInfo, 20e3);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();
///////////// This code is used to solve the Chrome Bug --- End /////////////

// 浏览器启动时，保存一次浏览记录到书签
saveHistoryByBookmark()

// 网页关闭时保存到书签
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // console.log(`页面 status: ${changeInfo.status}`);
        console.log(`tabs.onUpdated --> title: ${tab.title}, url: ${tab.url}`);
        saveHistoryByBookmark()
    }
});

// 把浏览历史保存到书签
async function saveHistoryByBookmark() {
  // 获取上次保留浏览历史结束的位置
  let lastIndexTimeResult = 0

  const bookmarks = await getRecentBookmarks(1);
  if (bookmarks.length > 0) {
      // 倒数第一个保存的书签，也就是最新的书签
      const historyItems = await browser.history.search({text: bookmarks[0].url, maxResults: 1})
      if (historyItems.length > 0) {
      lastIndexTimeResult = historyItems[0].lastVisitTime
      }
      // console.info('bootmarkHistories: ' + 'latest: ' + historyItems[0].title)
  }

  // 获取浏览历史
  let histories = await browser.history.search({text: '', startTime: Number(lastIndexTimeResult), maxResults: 1000000})
  histories = histories.filter(item => !isInvalidHistory(item.url))
  histories.sort((a, b) => a.lastVisitTime - b.lastVisitTime);
  console.info('histories'+ ', lastIndexTimeResult: ' + lastIndexTimeResult + ', size: ' + (histories.length) )
  
  // 循环查询的浏览历史另保存为书签
  for (var ht of histories) {
      // console.info('existingBookmark, title:' + (existingBookmark))
      await createAndUpdateHistoryBookamrks(ht.title, ht.url)
  }
}

function isInvalidHistory(url){
    if (
      url.includes('/search?') ||
      url.includes('/search/?') ||
      url.includes('/search%3F') ||
      url.includes('www.baidu.com/s?') ||
      url.includes('chrome-extension://') ||
      url.includes('chrome://') ||
      url.includes('edge://') ||
      url.includes('edge-extension://')
    ) {
      return true
    } 
    return false
}