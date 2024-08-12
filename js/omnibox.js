importScripts('pinyin/pinyinUtil.js');

let timerId;
function debounce(func, delay) {
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    func();
  }, delay);
}

browser.omnibox.onInputEntered.addListener(text => {
    browser.tabs.update({ url: text });
});

browser.omnibox.onInputChanged.addListener((text, suggest) => {
    if (text === "") {
        suggest([]);
        return;
    }

    debounce(async () => {
        console.info('current text: '+text)
        const upperText = text.trim().toUpperCase()
        const words = upperText.split(/\s+/);
        const eastAsianChars = upperText.match(/[\u2e80-\u9fff\u3040-\u30ff\uac00-\ud7af\u0102-\u1ef9]/g);
        const chineseChars =  upperText.match(/[\u4e00-\u9fa5]/g);
        const pinyinMap = new Map()
        if(chineseChars){
            chineseChars.forEach(char => {
                pinyinMap.set(char, pinyinUtil.getPinyin(char, '', false, false))
            })
        }

        let existingBookmarks = await getHistoryBookmarks();
        const searchHintItems = [];
        const matchFinalWords = []
        const matchEastAsianChars = []
        const matchPinyin = []

        for(let bm of existingBookmarks){
            let titleUpper = bm.title.toUpperCase()
            let urlUpper = bm.url.toUpperCase()
            let upperTextWithoutSpace = upperText.replace(/\s+/g, '')
            let titlePinyin = pinyinUtil.getPinyin(titleUpper, '', false, false).toUpperCase().replace(/\s+/g, '')
            // console.info("titlePinyin: "+titlePinyin)

            if(titleUpper.includes(upperTextWithoutSpace) || urlUpper.includes(upperTextWithoutSpace)){
                let regExp = new RegExp(upperTextWithoutSpace,"mgi")
                let title = bm.title.replace(regExp, "<match>$&</match>")
                let url = bm.url.replace(regExp, "<match>$&</match>")

                var desc = `${title.encodeXML()}  -  <url>${url.encodeXML()}</url>`
                searchHintItems.push({
                    content: bm.url,
                    description: desc,
                })
                continue
            }

            // 先判断拼音
            if(titlePinyin){
                title = bm.title
                url = bm.url

                let hasAllWords = words.every(word => titlePinyin.includes(word));
                if(hasAllWords) {
                    // console.info(titleUpper+"titlePinyin: "+titlePinyin+", words: "+words, "hasAllWords"+hasAllWords)
                    // console.info("words: "+words)
                    for(let char of [...titleUpper]){
                        if(!(/^[\u4e00-\u9fa5]+$/.test(char))){
                            continue
                        }
                        var charPinyin = pinyinUtil.getPinyin(char, '', false, false).toUpperCase()
                        let match = words.some(word => charPinyin.includes(word) || word.includes(charPinyin));
                        if(charPinyin && match){
                            // console.info("upperTextWithoutSpace: " +upperTextWithoutSpace+", char: "+char + ", pinyin: "+charPinyin)
                            title = title.replace(char, `<match>${char}</match>`)
                            url = url.replace(char, `<match>${char}</match>`)
                        }
                    }
                    var desc = `${title.encodeXML()}  -  <url>${url.encodeXML()}</url>`
                    matchPinyin.push({
                        content: bm.url,
                        description: desc,
                    })
                    continue
                }
            } 

            // 判断标题是不是匹配所有的单词
            if(words){       
                let matchWordCount = 0;
                // console.info("words: "+words)
                for(let word of words){
                    if(!titleUpper.includes(word)){
                        break
                    }
                    matchWordCount++
                }

                // 标题没有匹配上搜索内容，跳过
                if(matchWordCount !== words.length) {
                    continue;
                }

                // 如果是中文、日文、韩文则每个字匹配
                if(eastAsianChars){
                    title = bm.title
                    url = bm.url
                    let matchAsianCharCount = 0;
                    // console.info("eastAsianChars: "+eastAsianChars)
                    for(let char of eastAsianChars){
                        if(!titleUpper.includes(char)){
                            break
                        }
                        matchAsianCharCount++
                        regExp = new RegExp(char,'mgi')
                        title = title.replace(regExp, "<match>$&</match>")
                        url = url.replace(regExp, "<match>$&</match>")
                    }
                    // console.info("bm.title: "+title)
                    if(matchAsianCharCount === eastAsianChars.length) {
                        var desc = `${title.encodeXML()}  -  <url>${url.encodeXML()}</url>`
                        matchEastAsianChars.push({
                            content: bm.url,
                            description: desc,
                        })
                        continue;
                    }
                }

                // 最终匹配
                if(matchWordCount === words.length){       
                    title = bm.title
                    url = bm.url
                    let regExp = new RegExp(word,'mgi')
                    title = title.replace(regExp, "<match>$&</match>")
                    url = url.replace(regExp, "<match>$&</match>")
                    var desc = `${title.encodeXML()}  -  <url>${url.encodeXML()}</url>`
                    matchWords.push({
                        content: bm.url,
                        description: desc,
                    })
                    continue
                }
            }
        }
        searchHintItems.push(...matchEastAsianChars,...matchPinyin,...matchFinalWords)
        suggest(searchHintItems)
    }, 300);
});

const matchStaetRegex = new RegExp('&lt;match&gt;', "g");
const matchEndRegex = new RegExp('&lt;/match&gt;', "g");
String.prototype.encodeXML = function () {
    const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
    }
    return this.replace(/[&<>"']/g, (c) => entities[c])
        // 在搜索栏的提示Item中，关键词正常加粗
      .replace(matchStaetRegex, '<match>')
      .replace(matchEndRegex, '</match>')
}

RegExp.escape = function(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};