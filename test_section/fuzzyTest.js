const fs = require("fs");
const Fuse = require("fuse.js");

//const tags = JSON.parse(fs.readFileSync("./danbooru/tags/Character.json"));
const words = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/tag_words.json")
);

/*
const Fuse = require("fuse.js");
function findTagFuse(tagsList, searchTag) {
  const fuse = new Fuse(tagsList, { keys: ["name"], threshold: 0.2 });
  const results = fuse.search(searchTag);
  return results.length
    ? results.slice(0, 10).map((result) => result.item)
    : null;
}
*/

/*
function findTagFuzzy(tagsList, searchTag) {
  const fuse = new Fuse(tagsList, { keys: ["name"], threshold: 0.4 });
  const results = fuse.search(searchTag);
  return results.length ? results.map(result => result.item) : null;
}

const tags = [
  { name: "rem_(re:zero)", category: "character", post_count: 1000 },
  { name: "hatsune_miku", category: "character", post_count: 2000 },
  { name: "maid", category: "general", post_count: 3000 },
  { name: "blue_hair", category: "general", post_count: 4000 },
];

console.log(findTagFuzzy(data, "remrezero"));
*/

console.time("fuzzySearchWords");
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
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return dp[a.length][b.length];
}

function fuzzySearchWords(
  wordList,
  searchWord,
  maxDistance = 3,
  maxResults = 5
) {
  const filteredWords = wordList.filter((word) => {
    const letters = word.replace(/[^a-zA-Z]/g, "");
    const prefix = letters.slice(0, 2).toLowerCase();
    return prefix == searchWord.slice(0, 2).toLowerCase();
  });

  return filteredWords
    .map((word) => ({
      word,
      distance: levenshteinDistance(word, searchWord),
    }))
    .filter((result) => result.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map((result) => result.word);
}

/*
function searchMultipleWords(wordList, query) {
  const queryWords = query.toLowerCase().split(" ");
  let matchedWords = new Set();

  queryWords.forEach((word) => {
    const fuzzyMatches = fuzzySearchWords(wordList, word);
    matchedWords.add(fuzzyMatches);
  });

  return Array.from(matchedWords);
}

function findTagsByWords(tagList, wordGroups) {
  let filteredTags = tagList;

  for (const words of wordGroups) {
    filteredTags = filteredTags.filter((tag) => {
      const tagWordsSet = tag.name.split("_");
      return words.some((word) =>
        tagWordsSet.some((tagWord) => tagWord.includes(word))
      );
    });

    if (filteredTags.length === 0) break;
  }

  return filteredTags;
}

function searchTags(query) {
  const findWordResult = searchMultipleWords(words, query);
  console.log("Fuzzy search results:", findWordResult);
  const findTagResult = findTagsByWords(tags, findWordResult);

  return findTagResult.length
    ? findTagResult.slice(0, 10)
    : ["No matching tags found"];
}

const query = "rem re:zero";
console.log(searchTags(query));

//fuzzySearchWords("remilia");
//console.log(levenshteinDistance("remrezero", "rem_(re: zero)"));
*/

fuzzySearchWords(words, "rem", 2, 5);
console.timeEnd("fuzzySearchWords");
