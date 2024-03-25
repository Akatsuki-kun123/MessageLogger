const fs = require('fs');
const Database = require("@replit/database");
const tweets = require("./twitterScraping.js");

const pity = new Database();

async function pityCount(player) {
  let guarantee = await pity.list().then(players => new Promise((resolve, reject) => {
    if (players.indexOf(player) != -1) {
      pity.get(player).then(value => {
        if (value == 10) {
          pity.set(player, 0).then(() => {
            resolve(true);
          });
        } else {
          pity.set(player, value + 1);
          resolve(false);
        }
      });
    } else {
      pity.set(player, 0);
      resolve(false);
    }
  }));
  return guarantee;
}

async function checkGuarantee(player) {
  let data = await pity.list().then(players => new Promise((resolve, reject) => {
    if (players.indexOf(player) != -1) {
      try {
        fs.readdirSync(player);
      } catch (error) {
        console.log(error);
        resolve("false");
      }
      
      pity.get(player).then(value => {
        resolve(value);
      })
    } else {
      resolve("false");
    }
  }));

  return data;
}

function addTag(name, tag) {
  try {
    fs.readdirSync(name).map(fileName => {
      if (fileName.includes("tags")) {
        fs.appendFileSync(`./${name}/${fileName}`, `\n${tag}`);
      }
    });
  } catch (error) {
    fs.mkdirSync(`./${name}`);
    fs.writeFileSync(`./${name}/${name}_tags.txt`, tag);
    fs.writeFileSync(`./${name}/${name}_links.txt`, "");
    tweets.searchImages(`./${name}/${name}_links.txt`, 1, tag);
  }
}
/*
pity.list().then(keys => {
  keys.map(key => {
    pity.get(key).then(value => {
      console.log(`${key}: ${value}`)
    });
  })
});
*/
module.exports = {pityCount: pityCount, addTag: addTag, checkGuarantee: checkGuarantee}
