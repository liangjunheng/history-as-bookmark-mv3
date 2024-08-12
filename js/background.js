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
        if(isInvalidHistory(tab.url)) {
          return
        }
        saveHistoryByBookmark()
    }
});

var interval = null
var isLocked = false
async function saveHistoryByBookmark() {
  if(interval){
    clearInterval(interval);
  }
  if (isLocked) {
    // console.info('saveHistoryByBookmark isLocked!!!!!!!!!!!!!!!!!!')
    interval = setInterval(saveHistoryByBookmark, 1000)
    return
  }
  isLocked = true
  try {
    await saveHistoryByBookmarkLocked()
  } catch (error) {
    console.warn('saveHistoryByBookmark, error: ' + error)
  } finally {
    isLocked = false
  }
}

// 把浏览历史保存到书签
async function saveHistoryByBookmarkLocked() {
  // 获取最新书签对应的那条浏览记录
  let lastHistoryItem;
  // 获取插件最新保存的书签
  const bookmark = await getRecentBookmark();
  if(bookmark && bookmark.url) {
    // console.info('bootmarkHistories: ' + 'bookmark: ' + bookmark.title)
    const historyItems = await browser.history.search({text: bookmark.url, maxResults: 1})
    if (historyItems.length > 0) {
      lastHistoryItem = historyItems[0]
      // console.info('bootmarkHistories: ' + 'lastHistoryItem: ' + historyItems[0].title)
    }
  }

  // 定义获取浏览历史的开始时间
  let lastSavedBookmarkTime = 0
  if(lastHistoryItem) {
    lastSavedBookmarkTime = lastHistoryItem.lastVisitTime
  }

  // 获取浏览历史
  let histories = await browser.history.search({text: '', startTime: lastSavedBookmarkTime, maxResults: 1000000})
  // !(lastHistoryItem && item.id == lastHistoryItem.id) 因为lastHistoryItem已经保存到书签，所以丢弃该历史记录
  histories = histories.filter(item => !isInvalidHistory(item.url) && !(lastHistoryItem && item.id == lastHistoryItem.id))
  histories.sort((a, b) => a.lastVisitTime - b.lastVisitTime);
  console.info('histories'+ ', lastSavedBookmarkTime: ' + lastSavedBookmarkTime + ', size: ' + (histories.length) )
  
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