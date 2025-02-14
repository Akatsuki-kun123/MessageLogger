const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");

var headers = {
  "accept": "text/html, image/webp, image/apng, image/svg+xml, */*;q=0.8",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "en-US;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0",
};

var headers2 = {
  "Cache-Control": "max-age=0",
  "sec-ch-ua":
    '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "iOS",
  "Upgrade-Insecure-Requests": 1,
  "User-Agent":
    "Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-User": "?1",
  "Sec-Fetch-Dest": "document",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
};

var headers3 = {
  "User-Agent":
    "Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1",
};

let options = {
  url: "https://testbooru.donmai.us/posts/9402.json",
  headers: headers,
};

request("https://testbooru.donmai.us/posts/9402.json", (error, response, body) => {
  if (!error && response.statusCode == 200) {
    //const $ = cheerio.load(body);
    //console.log(response);
  } else {
    //console.log(response.statusCode);
  }
});
