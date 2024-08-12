const ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER___ = '___HISTORY___';
let ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___ = null;

async function createHistoryBookmarkFolder(name = ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER___){
  const bookmarks = await browser.bookmarks.search({title: name})
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
  let bookmarks = await browser.bookmarks.getRecent(50)
  for (let bookmark of bookmarks) {
    if (bookmark.parentId == ___EXTENSION_HISTORY_AS_BOOKMARKS_FOLDER_ID___) {
      return bookmarks[0]
    }
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

async function createAndUpdateHistoryBookamrks(title, url) {
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
  return Promise.resolve(newBookmark)
}
