const fs = require("fs");
const axios = require("axios");

const CATEGORY_MAP = {
  0: "General",
  1: "Artist",
  3: "Copyright",
  4: "Character",
  5: "Meta",
};

async function fetchAllTags() {
  let allTags = [];
  let page = 1; // Start from page 1
  const limit = 1000; // Max per request

  console.log("🔄 Fetching all Danbooru tags...");

  while (true) {
    console.log(`🔍 Fetching page ${page}...`);
    try {
      const url = `https://danbooru.donmai.us/tags.json?limit=${limit}&page=${page}&search[order]=count&search[hide_empty]=true`;
      const response = await axios.get(url);
      const tags = response.data;

      if (!tags || tags.length === 0) {
        console.log("✅ No more tags to fetch!");
        break; // Exit loop when no more tags are returned
      }

      allTags.push(...tags); // Append fetched tags to the list
      page++; // Move to the next page
    } catch (error) {
      console.error("❌ Error fetching tags:", error);
      break; // Exit on error
    }
  }

  console.log(`✅ Fetched total ${allTags.length} tags. Filtering...`);

  // ✅ Filter out tags with `post_count > 0`
  const validTags = allTags.filter((tag) => tag.post_count > 0);

  // ✅ Categorize tags
  const categorizedTags = {};
  for (const tag of validTags) {
    const categoryName = CATEGORY_MAP[tag.category] || "Unknown";
    if (!categorizedTags[categoryName]) {
      categorizedTags[categoryName] = [];
    }

    categorizedTags[categoryName].push({
      name: tag.name,
      category: CATEGORY_MAP[tag.category],
      postCount: tag.post_count,
    });
  }

  console.log("✅ Categorized tags. Saving to file...");

  // ✅ Save to `danbooru_tags.json`
  fs.writeFileSync(
    "./danbooru/tags/danbooru_tags.json",
    JSON.stringify(categorizedTags, null, 2),
    "utf-8"
  );

  // Save each category to a separate file
  for (const [categoryName, tag] of Object.entries(categorizedTags)) {
    const filename = `./danbooru/tags/${categoryName}.json`;
    fs.writeFileSync(filename, JSON.stringify(tag, null, 2));
    console.log(`✅ Saved ${tag.length} tags to ${filename}`);
  }

  console.log("📁 Successfully saved all tags to `danbooru_tags.json`!");
}

function splitTagsToWords() {
  const categorizedTags = JSON.parse(
    fs.readFileSync("./danbooru/tags/danbooru_tags.json", "utf-8")
  );
  const words = new Set();

  for (const [category, tags] of Object.entries(categorizedTags)) {
    tags.forEach((tag) => {
      const tagWords = tag.name.split("_");
      tagWords.forEach((word) => {
        //word = word.replace(/[^\w]/g, " ").trim();
        if (word != "") {
          words.add(word.toLowerCase());
        }
      });
    });
  }

  const result = Array.from(words).sort();
  fs.writeFileSync(
    "./danbooru/tags/tag_words.json",
    JSON.stringify(result, null, 2)
  );

  console.log("✅ Done! Total words:", result.length);
}

async function getPostsFromTags(tags, minPosts = 10) {
  const results = {};

  for (const tag of tags) {
    console.log(`🔍 Fetching posts for tag: ${tag}...`);
    try {
      const postsUrl = `https://danbooru.donmai.us/posts.json?limit=${minPosts}&tags=${encodeURIComponent(
        tag
      )}`;
      const response = await axios.get(postsUrl);
      const posts = response.data;

      if (!posts || posts.length === 0) {
        console.log(`❌ No posts found for tag: ${tag}`);
        continue;
      }

      // Store results for this tag
      results[tag] = posts.slice(0, minPosts).map((post) => ({
        id: post.id,
        imageUrl: post.file_url,
        tags: post.tag_string,
        source: `https://danbooru.donmai.us/posts/${post.id}`,
      }));
    } catch (error) {
      console.error(`❌ Error fetching posts for tag: ${tag}`, error);
    }
  }

  console.log("✅ Fetched posts for all tags!");

  // ✅ Save to `danbooru_posts.json`
  fs.writeFileSync(
    "./danbooru/tags/danbooru_posts.json",
    JSON.stringify(results, null, 2)
  );
  console.log("📁 Successfully saved posts to `danbooru_posts.json`!");
}

// Test function
//fetchAllTags();
//const tags = ["rem_(re:zero)", "hatsune_miku", "maid", "blue_hair"];
//getPostsFromTags(tags, 10);
splitTagsToWords();
