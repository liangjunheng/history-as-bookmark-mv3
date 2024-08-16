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
  // 获取插件最新保存的书签
  const bookmark = await getRecentBookmark();

  // 获取浏览历史的开始时间
  let lastSavedBookmarkTime = bookmark.dateAdded;
  if(bookmark && bookmark.url) {
    console.info(`saveHistoryByBookmarkLocked, recentBookmark: title: ${bookmark.title}, url: ${bookmark.url}, dateAdded: ${bookmark.dateAdded}`)
    let visitItems = await browser.history.getVisits({url: bookmark.url})
    if(visitItems.length > 0){
      lastSavedBookmarkTime = visitItems[visitItems.length - 1].visitTime
      // console.info(`saveHistoryByBookmarkLocked, foundHistoryItem: lastSavedBookmarkTime: ${lastSavedBookmarkTime}`)
    }
  }

  // 获取浏览历史
  let histories = await browser.history.search({text: '', startTime: lastSavedBookmarkTime, maxResults: 1000000})
  // !(lastHistoryItem && item.id == lastHistoryItem.id) 因为lastHistoryItem已经保存到书签，所以丢弃该历史记录
  histories = histories.filter(item => !isInvalidHistory(item.url) && item.url != bookmark.url)
  histories.sort((a, b) => a.lastVisitTime - b.lastVisitTime);
  console.info('saveHistoryByBookmarkLocked'+ ', lastSavedBookmarkTime: ' + lastSavedBookmarkTime + ', size: ' + (histories.length) )
  
  // 循环查询的浏览历史另保存为书签
  let idleState = 'idle'
  for (let [index, ht] of histories.entries()) {
    if (index % 3 == 0 && idleState == 'active') {
      // 浏览器处于忙碌状态，慢慢创建书签
      // console.info('saveHistoryByBookmarkLocked is busy, sleep a moment!')
      await sleep(2048)
    }
    // console.info(`saveHistoryByBookmarkLocked,creating bookmarks title: ${ht.title}`)
    await createAndUpdateHistoryBookmarks(ht.title, ht.url)

    // 更新一下状态
    idleState = await chrome.idle.queryState(15)
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