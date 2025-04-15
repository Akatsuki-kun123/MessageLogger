const fs = require("fs");
const path = require("path");

const words = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/tag_words.json")
);

console.time("runtime");
function levenshteinDistance(a, b) {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

class BKTree {
  constructor(distanceFunc = levenshteinDistance, root = null) {
    this.root = root;
    this.distance = distanceFunc;
  }

  insert(word) {
    if (!this.root) {
      this.root = { word, children: {} };
      return;
    }

    let node = this.root;
    while (true) {
      let dist = this.distance(word, node.word);
      if (dist === 0) return;

      if (!node.children[dist]) {
        node.children[dist] = { word, children: {} };
        return;
      }

      node = node.children[dist];
    }
  }

  search(query, maxDist) {
    if (!this.root) return [];
    let results = [];

    const searchRecursive = (node) => {
      let dist = this.distance(query, node.word);
      if (dist <= maxDist) results.push({ word: node.word, dist });

      for (let key in node.children) {
        let childDist = parseInt(key);
        if (childDist >= dist - maxDist && childDist <= dist + maxDist) {
          searchRecursive(node.children[key]);
        }
      }
    };

    searchRecursive(this.root);
    return results
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 10)
      .map((res) => res.word);
  }

  saveToFile(filename) {
    fs.writeFileSync(filename, JSON.stringify(this.root, null, 2));
  }

  static loadFromFile(filename, distanceFunc = levenshteinDistance) {
    if (!fs.existsSync(filename)) return new BKTree(distanceFunc);
    let rawData = fs.readFileSync(filename);
    let root = JSON.parse(rawData);
    return new BKTree(distanceFunc, root);
  }
}

function filterWordsByStartChars(words) {
  const wordsGroups = {};
  const exceptions = "_other";

  for (const word of words) {
    const lettersOnly = word.replace(/[^a-zA-Z0-9]/g, "");

    if (!lettersOnly.length) {
      if (!wordsGroups[exceptions]) wordsGroups[exceptions] = {};
      if (!wordsGroups[exceptions][exceptions]) {
        wordsGroups[exceptions][exceptions] = [];
      }
      wordsGroups[exceptions][exceptions].push(word);
      continue;
    }

    const startChar = lettersOnly[0].toLowerCase();
    const secondChar = lettersOnly[1]
      ? lettersOnly[1].toLowerCase()
      : exceptions;

    if (!wordsGroups[startChar]) wordsGroups[startChar] = {};
    if (!wordsGroups[startChar][secondChar]) {
      wordsGroups[startChar][secondChar] = [];
    }
    wordsGroups[startChar][secondChar].push(word);
  }

  return wordsGroups;
}

function saveBKTreeData(
  wordsGroups,
  distanceFunc,
  outputDir = "./bot_func/fuzzy_search/bk_tree_data"
) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  for (const beginChar in wordsGroups) {
    for (const secondChar in wordsGroups[beginChar]) {
      const bkTree = new BKTree(distanceFunc);

      wordsGroups[beginChar][secondChar].forEach((word) => {
        bkTree.insert(word);
      });

      const folderPath = path.join(outputDir, beginChar);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

      const filename = path.join(folderPath, `${secondChar}.json`);
      bkTree.saveToFile(filename);
      console.log(`BK-Tree data saved to ${filename}`);
    }
  }
}

function genTrees() {
  const grouped = filterWordsByStartChars(words);
  saveBKTreeData(grouped, levenshteinDistance);
}

function findSuitableTrees(
  queryWord,
  maxDistance = 2,
  inputDir = "./bot_func/fuzzy_search/bk_tree_data"
) {
  const filePath = path.join(
    inputDir,
    /^[a-zA-Z0-9]$/.test(queryWord[0]) ? queryWord[0] : "_other",
    /^[a-zA-Z0-9]$/.test(queryWord[1]) ? `${queryWord[1]}.json` : "_other.json"
  );
  if (!fs.existsSync(filePath)) return [];

  console.log(`Loading BK-Tree from ${filePath}`);
  const bkTree = BKTree.loadFromFile(filePath);
  return bkTree.search(queryWord, maxDistance);
}

/*
let bkTree = new BKTree(levenshteinDistance);
words.forEach((word) => bkTree.insert(word));
bkTree.saveToFile("./testSection/bk_tree.json");
*/

/*
let bkTree = BKTree.loadFromFile(
  "./test_section/bk_tree_data/bk_tree.json",
  levenshteinDistance
);
console.log(bkTree.search("rem", 1));
*/

const wordsTest = [
  "reimu",
  "remilia",
  "rem",
  "ren",
  "rei",
  "patchouli",
  "cirno",
  "cir",
  "cat",
  "car",
  "dog",
];

const results = findSuitableTrees("rem", 2);
console.log(results);
console.timeEnd("runtime");