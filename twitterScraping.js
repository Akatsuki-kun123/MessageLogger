const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

var headers = {
  "User-Agent": "Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
};

var data = [];
var image = '';
var artist = '';
var artistURL = '';

class Illustrator {
  constructor(image, artist, artistURL) {
    this.image = image;
    this.artist = artist;
    this.artistURL = artistURL;
  }
};

function searchImages(file) {
  const d = new Date();
  let day = d.getDate();
  var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  if (day == config.date) {
    config.page += 1;
    fs.writeFileSync('config.json', JSON.stringify(config, null, '\t'));
  } else {
    config.page = 1;
    config.date = day;
    fs.writeFileSync('config.json', JSON.stringify(config, null, '\t'));
  }
  
  let wait = 0;

  config.tags.map(function(elem, index) {
    setTimeout(() => {
      request(`https://danbooru.donmai.us/posts?page=${config.page}&tags=${elem}`, {headers: headers}, (error, response, body) => {
        if(!error && response.statusCode == 200){
          const $ = cheerio.load(body);
          $('.post-preview-link').map(function(index, elem) {
            var link = $(elem).attr("href");
            getImages(link, file);
          });
        }
      });
    }, wait.toString());

    wait = wait + 5000;
  })
}

function getImages(link, file) {
  request(`https://danbooru.donmai.us${link}`, {headers: headers}, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      artist = $('li.tag-type-1').attr("data-tag-name");
      try {
        var alen = artist.length;
      } catch (error) {
        return 0;
        artist = "undefined";
      }
      image = $('.fit-width').attr("src");
      $('li.tag-type-1').children().map((index, elem) => {
        if (index == 1) {
          artistURL = $(elem).attr('href');
          try {
            var ulen = artistURL.length;
          } catch (error) {
            artistURL = `https://danbooru.donmai.us${link}`;
          }
        }
      });

      let illustrator = new Illustrator(image, artist, artistURL);
      data.push(illustrator);
      fs.writeFileSync(file, JSON.stringify(data, null, '\t'));
    }
  });
}

module.exports = {searchImages: searchImages}