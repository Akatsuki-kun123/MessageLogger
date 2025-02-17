const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");

var headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0",
};

var data = [];
var image = "";
var artist = "";
var artistURL = "";

class Illustrator {
  constructor(image, artist, artistURL) {
    this.image = image;
    this.artist = artist;
    this.artistURL = artistURL;
  }
}

function searchImages(file) {
  const d = new Date();
  let day = d.getDate();
  var config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  if (day == config.date) {
    config.page += 1;
    fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
  } else {
    config.page = 1;
    config.date = day;
    fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
  }

  let wait = 0;
  config.tags.map(function (elem, index) {
    setTimeout(() => {
      request(
        `https://danbooru.donmai.us/posts?page=${config.page}&tags=${elem}`,
        { headers: headers },
        (error, response, body) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(body);
            $(".post-preview-link").map(function (index, elem) {
              var link = $(elem).attr("href");
              //console.log(link);
              //getImages(link, file);
            });
          } else {
            //console.log(response.statusCode);
          }
        }
      );
    }, wait.toString());

    wait = wait + 5000;
  });
}

function getImages(link, file) {
  request(
    `https://danbooru.donmai.us${link}`,
    { headers: headers },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(body);
        artist = $("li.tag-type-1").attr("data-tag-name");
        try {
          var alen = artist.length;
        } catch (error) {
          return 0;
          artist = "undefined";
        }
        image = $(".fit-width").attr("src");
        $("li.tag-type-1")
          .children()
          .map((index, elem) => {
            if (index == 1) {
              artistURL = $(elem).attr("href");
              try {
                var ulen = artistURL.length;
              } catch (error) {
                artistURL = `https://danbooru.donmai.us${link}`;
              }
            }
          });

        let illustrator = new Illustrator(image, artist, artistURL);
        data.push(illustrator);
        //console.log(data);
        //fs.writeFileSync(file, JSON.stringify(data, null, '\t'));
      }
    }
  );
}

//module.exports = {searchImages: searchImages}

searchImages("data.json");
