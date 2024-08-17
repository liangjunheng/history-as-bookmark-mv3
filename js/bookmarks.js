const ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER___ = '___HISTORY___';
let ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___ = null;

async function createHistoryBookmarkFolder(name = ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER___){
  let bookmarks = await browser.bookmarks.search({title: name})
  bookmarks = bookmarks.filter(item => item.title == name)

  let nodeId
  if(bookmarks.length > 0){
    nodeId = bookmarks[0].id
  } else {
    const markbook = await browser.bookmarks.create({title: name});
    nodeId = markbook.id
  }
  ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___ = nodeId
  // console.info(`createHistoryBookmarkFolder, nodeId: ${nodeId}`)
  return Promise.resolve(nodeId)
}

async function getRecentBookmark() {
  await createHistoryBookmarkFolder()
  // console.info(`getRecentBookmarks, ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___: ${___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___}`)
  
  // 获取 ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER___ 目录下所有的书签，并按最新时间开始排序
  bookmarks = await browser.bookmarks.getChildren(___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___)
  bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
  if(bookmarks.length > 0){
    return bookmarks[0]
  }

  return null
}

async function removeBookmark(id, parentId) {
  if(!id || parentId != ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___){
    console.warn(`removeBookmark, id(${id}), parentId(${parentId}) is invaild`)
    return
  }
  
  try {
    await browser.bookmarks.remove(id)
    await sleep(32)
  } catch (error) {
    console.warn('removeBookmark id:' + id + ', error: ' + error)
  }
}

async function removeBookmarkByUrl(url) {
  if(!url){
    console.warn(`remove bookmark, url(${url}) is invaild`)
    return
  }

  let bookmarks = await browser.bookmarks.search({url: url})
  for (let bookmark of bookmarks) {
    await removeBookmark(bookmark.id, bookmark.parentId)
  }
}

async function removeBookmarkByTitle(title) {
  if(!title){
    console.warn(`remove bookmark, title(${title}) is invaild`)
    return
  }

  let bookmarks = await browser.bookmarks.search({title: title})
  for (let bookmark of bookmarks) {
    await removeBookmark(bookmark.id, bookmark.parentId)
  }
}

async function createAndUpdateHistoryBookmarks(title, url) {
  if (!url || !title) {
    console.warn(`title(${title}), url(${url}) and folderId(${___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___}) required when creating bookmark.`)
    return Promise.resolve(null)
  }
  // console.info('addItemIntoBookmarkFolder, create bookmark: url: ' + url +", title: "+ title)

  // 创建保存浏览记录的书签文件夹
  await createHistoryBookmarkFolder()
  // 删除原来的书签
  await removeBookmarkByTitle(title)
  await removeBookmarkByUrl(url)
  // 创建书签
  const newBookmark = await browser.bookmarks.create({title: title, url: url, parentId: ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___, index: 0})
  await sleep(32)
  return Promise.resolve(newBookmark)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}