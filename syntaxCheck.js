/*
let data = require("./danbooru/tags/danbooru_tags.json");

const Fuse = require("fuse.js");

function findTagFuzzy(tagsList, searchTag) {
  const fuse = new Fuse(tagsList, {
    key: ["name"],
    includeScore: true,
    threshold: 0.4,
  });
  const result = fuse.search(searchTag);
  return result.length ? result[0].item : null;
}

// Example usage
console.log(data);
console.log(findTagFuzzy(data, "rem")); // Output: "maid"
console.log(findTagFuzzy(data, "bluehair")); // Output: "blue_hair"
console.log(findTagFuzzy(data, "blu")); // Output: null
*/

const Fuse = require("fuse.js");

function findTagFuzzy(tagsList, searchTag) {
  const fuse = new Fuse(tagsList, { keys: ["name"], threshold: 0.4 });
  const result = fuse.search(searchTag);
  return result.length ? result[0].item : null;
}

const tags = [
  { name: "rem_(re:zero)", category: "character", post_count: 1000 },
  { name: "hatsune_miku", category: "character", post_count: 2000 },
  { name: "maid", category: "general", post_count: 3000 },
  { name: "blue_hair", category: "general", post_count: 4000 },
];
console.log(findTagFuzzy(tags, "blu_hair"));
// Output: { name: "blue_hair", category: "general", post_count: 4000 }
