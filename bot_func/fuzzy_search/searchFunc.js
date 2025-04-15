const fs = require("fs");
const path = require("path");

const { BKTree } = require("./bkTree.js");

const characters = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/Character.json")
);
const copyrights = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/Copyright.json")
);
const artists = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/Artist.json")
);
const general = JSON.parse(
  fs.readFileSync("./bot_func/danbooru/tags/General.json")
);
const meta = JSON.parse(fs.readFileSync("./bot_func/danbooru/tags/Meta.json"));
const allTags = [characters, copyrights, artists, general, meta].flat();

// Seach for words using BKTree
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

  const bkTree = BKTree.loadFromFile(filePath);
  return bkTree.search(queryWord, maxDistance);
}

function searchMultipleWords(query, maxDistance = 2) {
  const queryWords = query.toLowerCase().split("_");
  let matchedWords = new Set();

  queryWords.forEach((word) => {
    const fuzzyMatches = findSuitableTrees(word, maxDistance);
    matchedWords.add(fuzzyMatches);
  });

  return Array.from(matchedWords);
}

function findTagByWords(
  query,
  maxResults = 5,
  maxDistance = 2,
  category = "all"
) {
  const searchWords = searchMultipleWords(query, maxResults, maxDistance);
  let tagsList = allTags;
  switch (category) {
    case "characters":
    case 4:
      tagsList = characters;
      break;
    case "copyrights":
    case 3:
      tagsList = copyrights;
      break;
    case "artists":
    case 2:
      tagsList = artists;
      break;
    case "general":
    case 1:
      tagsList = general;
      break;
    case "meta":
    case 0:
      tagsList = meta;
      break;
    default:
      tagsList = allTags;
      break;
  }
  let results = tagsList;

  for (const words of searchWords) {
    results = results.filter((tag) => {
      const tagWords = tag.name.split("_");
      return words.some((word) => tagWords.some((tagWord) => tagWord == word));
    });
  }

  return results.length ? results.slice(0, maxResults) : null;
}

module.exports = {
  findTagByWords,
};
