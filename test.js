const axios = require("axios");

const tag = "danboo";
const url = `https://danbooru.donmai.us/posts.json?tags=${tag}+order:random&limit=1`;

axios
  .get(url)
  .then((response) => {
    const posts = response.data;
    if (posts.length === 0) {
      console.log(`No posts found with the tag "${tag}".`);
    } else {
      const post = posts[0];
      console.log(`Random Post ID: ${post.id}, Image: ${post.file_url}`);
    }
  })
  .catch((error) => {
    console.error(
      "Error fetching random post:",
      error.response ? error.response.data : error.message
    );
  });
