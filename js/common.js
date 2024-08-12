importScripts('sha256.js')

const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = chrome || (isFirefox && browser);

function compressString(str) {
    const freqMap = {};
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      freqMap[char] = (freqMap[char] || 0) + 1;
    }
    
    const queue = Object.entries(freqMap).map(([char, freq]) => ({ char, freq }));
    while (queue.length > 1) {
      const node1 = queue.shift();
      const node2 = queue.shift();
      const mergedNode = { char: null, freq: node1.freq + node2.freq, left: node1, right: node2 };
      queue.push(mergedNode);
      queue.sort((a, b) => a.freq - b.freq);
    }
    
    const encodingMap = {};
    function buildEncodingMap(node, path = '') {
      if (!node.left && !node.right) {
        encodingMap[node.char] = path;
        return;
      }
      if (node.left) {
        buildEncodingMap(node.left, path + '0');
      }
      if (node.right) {
        buildEncodingMap(node.right, path + '1');
      }
    }
    buildEncodingMap(queue[0]);
    
    let compressed = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      compressed += encodingMap[char];
    }
    
    return compressed;
  }
  
  function decompressString(compressed) {
    const freqMap = {};
    for (let i = 0; i < compressed.length; i++) {
      const bit = compressed[i];
      freqMap[bit] = (freqMap[bit] || 0) + 1;
    }
    
    const queue = Object.entries(freqMap).map(([bit, freq]) => ({ char: bit, freq }));
    while (queue.length > 1) {
      const node1 = queue.shift();
      const node2 = queue.shift();
      const mergedNode = { char: null, freq: node1.freq + node2.freq, left: node1, right: node2 };
      queue.push(mergedNode);
      queue.sort((a, b) => a.freq - b.freq);
    }
    
    let decompressed = '';
    let currentNode = queue[0];
    for (let i = 0; i < compressed.length; i++) {
      const bit = compressed[i];
      if (bit === '0') {
        currentNode = currentNode.left;
      } else if (bit === '1') {
        currentNode = currentNode.right;
      }
      if (!currentNode.left && !currentNode.right) {
        decompressed += currentNode.char;
        currentNode = queue[0];
      }
    }
    
    return decompressed;
  }