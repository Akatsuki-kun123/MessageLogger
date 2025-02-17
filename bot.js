require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");

const pity = require("./pityHandler.js");
const tweets = require("./twitterScraping.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const token = process.env["token"];

//Login status
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const snipes = new Discord.Collection();

//change status
var status = "online";
function change_status(stat, file) {
  fs.open(file, "r+", function (err, fd) {
    if (err) {
      return console.error(err);
    }

    fs.writeFile(file, stat, function (err) {
      if (err) {
        return console.error(err);
      }
    });

    fs.close(fd, function (err) {
      if (err) {
        console.log(err);
      }
    });
  });
}

//Log deleted message
client.on("messageDelete", (message) => {
  snipes.set(message.channel.id, message);
  const LogChannel = client.channels.cache.get("1340390483855282216");

  if (message.author.id == 0) {
    LogChannel.send("Bí mật của chồng, không ai được biết.");
    return 0;
  } else if (
    message.author.id == 1027765339389431828 ||
    message.author.id == 571027211407196161
  ) {
    return 0;
  } else if (message.author.id == 1012001069267681320) {
    LogChannel.send(`Bé ${message.author} đáng yêu quá chị ko nỡ (>.<")`);
    return 0;
  }

  try {
    const DeletedLog = new EmbedBuilder()
      .setTitle("Deleted Message")
      .addFields({
        name: "Deleted by",
        value: `${message.author} - (${message.author.id})`,
      })
      .addFields({ name: "In", value: message.channel.name })
      .setColor("#FF0000")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    if (message.content) {
      DeletedLog.addFields({ name: "Content", value: message.content });
    }
    if (message.attachments.first()) {
      //console.log(message.attachments);
      let attachment = message.attachments.first();

      if (attachment.contentType.includes("image")) {
        DeletedLog.setImage(attachment.url);
      } else if (attachment.contentType.includes("video")) {
        DeletedLog.addFields({ name: "Ps", value: "Has the below video" });
      } else if (attachment.contentType.includes("audio")) {
        DeletedLog.addFields({ name: "Ps", value: "Has the below audio" });
      } else {
        DeletedLog.addFields({
          name: "Ps",
          value: `Has pdf attachment name ${
            attachment.title ? attachment.title : attachment.name
          }`,
        });
      }
    } else {
      DeletedLog.addFields({ name: "Ps", value: "No attachments" });
    }

    LogChannel.send({ embeds: [DeletedLog] });
    if (message.attachments.first()) {
      let attachment = message.attachments.first();
      if (attachment.contentType.includes("video")) {
        LogChannel.send({
          files: [attachment.url],
        });
      } else if (attachment.contentType.includes("audio")) {
        LogChannel.send({
          files: [attachment.url],
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

//get danbooru image
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase().includes("danbooru")) {
    let has_tag = false;
    let random_id = Math.floor(Math.random() * 10000) + 1;
    let url = `https://danbooru.donmai.us/posts/${random_id}.json`;
    if (message.content.toLowerCase().includes("tag")) {
      has_tag = true;
      let parts = message.content
        .toLowerCase()
        .split(":")
        .map((s) => s.trim());

      if (parts.length > 1 && parts[1]) {
        let tag = encodeURIComponent(parts[1]);
        url = `https://danbooru.donmai.us/posts.json?tags=${tag}+order:random&limit=1`;
      } else {
        message.channel.send(
          "Bà mẹ chú gõ sai lệnh rồi (˵¯͒ ▂¯͒˵)! Nó phải như này này (¬▂¬) : `tag: danboo`"
        );
        return 0;
      }
    }

    const DanbooruLog = new EmbedBuilder()
      .setTitle("Danbooru Image")
      .setColor("#FFD700");

    axios
      .get(url, {})
      .then((response) => {
        let data = response.data;
        if (has_tag) {
          if (data.length == 0) {
            message.channel.send(
              "Có vẻ không tìm được post rồi chú thử tag khác xem ┐(￣ ヘ￣)┌."
            );
            return 0;
          } else {
            data = data[0];
          }
        }

        DanbooruLog.setImage(data.file_url);
        DanbooruLog.setURL(`https://danbooru.donmai.us/posts/${data.id}`);
        DanbooruLog.addFields({
          name: "Artist",
          value: data.tag_string_artist,
        });
        DanbooruLog.addFields({
          name: "Character",
          value: data.tag_string_character,
        });
        DanbooruLog.addFields({
          name: "Source",
          value: data.source,
        });

        message.channel.send({ embeds: [DanbooruLog] });
      })
      .catch((error) => {
        console.log(error);
      });
  } else if (message.content.toLowerCase().includes("find tag:")) {
    let searchQuery = message.content.substring(9).trim();

    if (!searchQuery) {
      return message.channel.send(
        "Bà mẹ chú gõ sai lệnh rồi (˵¯͒ ▂¯͒˵)! Nó phải như này này (¬▂¬) : `find tag: cute`"
      );
    }

    let encodedQuery = encodeURIComponent(`*${searchQuery}*`);
    let url = `https://danbooru.donmai.us/tags.json?search[name_matches]=${encodedQuery}`;

    axios
      .get(url)
      .then((response) => {
        const data = response.data;

        if (!Array.isArray(data) || data.length === 0) {
          return message.channel.send(
            "Có vẻ không có tag nào giống cái này rồi ᇂ_ᇂ."
          );
        }

        let tagList = data
          .slice(0, 20)
          .map(
            (tag) =>
              `🔹 **${tag.name.replace(/_/g, "\\_")}** (Posts: ${
                tag.post_count
              })`
          )
          .join("\n");

        const TagList = new EmbedBuilder()
          .setTitle(`🔍 Tag Search Results for "${searchQuery}"`)
          .setDescription(tagList)
          .setColor("#FF8C00")
          .setFooter({
            text: "Danbooru Tag Search",
            iconURL: "https://testbooru.donmai.us/favicon.ico",
          });

        message.channel.send({ embeds: [TagList] });
      })
      .catch((err) => {
        console.error("Error fetching:", err);
      });
  }
});

//message handler
client.on("messageCreate", (message) => {
  const Log = client.channels.cache.get(message.channel.id);

  //admin mention
  if (message.content.toLowerCase().includes("vợ bách")) {
    Log.send("Hả anh còn con nào ngoài tôi? -_-");
  } else if (message.content.includes("<@596283000023416852>")) {
    if (fs.readFileSync("akat_status.txt", "utf8") == "offline") {
      Log.send("Chồng em đang không có nhà better call back saul! (m_ _m)");
    }
  }

  //gacha
  /*
  try {
    const GiftChannel = client.channels.cache.get('1064520522072866826');
    
    if (Math.floor(Math.random() * 31) == 1) {
      if (message.author.id == 1027765339389431828 || message.author.id == 571027211407196161) {
        return 0;
      }

      let giftList = JSON.parse(fs.readFileSync("data.json", 'utf8'));
      let giftNo = Math.floor(Math.random() * giftList.length);
      let gift = giftList.splice(giftList, 1)[0];
      const GiftLog = new EmbedBuilder()
        .setTitle("Gatcha Gift")
        .addFields({name: 'For', value: `${message.author}`})
        .addFields({name: 'Artist', value: String(gift.artist)})
        .setURL(`https://danbooru.donmai.us/${gift.artistURL}`)
        .setImage(gift.image)
        .setColor('#FFD700')
        .setThumbnail(message.author.displayAvatarURL({dynamic: true}));
      
      GiftChannel.send({ embeds: [GiftLog] });
      fs.writeFileSync("data.json", JSON.stringify(giftList, null, '\t'));
    }
  } catch (error) {
    Log.send("Xin lỗi nhưng bé vừa hết ảnh mất rồi (⋟﹏⋞)");
    tweets.searchImages("data.json")
  }
  */

  //set status
  if (message.author.id == 596283000023416852) {
    if (message.content.toLowerCase().includes("anh về rồi này")) {
      Log.send("Mừng anh về nhà ! (✿◠‿◠)");
      status = "online";
      change_status(status, "akat_status.txt");
    } else if (message.content.toLowerCase().includes("anh đi nha")) {
      Log.send("Anh đi mạnh khỏe !  (•◡•) /");
      status = "offline";
      change_status(status, "akat_status.txt");
    } else if (message.content.toLowerCase().includes("ngủ thôi em")) {
      Log.send("Dạ !  (●´□`)♡");
      status = "offline";
      change_status(status, "akat_status.txt");
    } else if (
      message.content.toLowerCase().includes("trốn vợ chơi game thôi")
    ) {
      status = "online";
      change_status(status, "akat_status.txt");
    }
  } else {
    if (message.content.toLowerCase().includes("anh về rồi này")) {
      Log.send("Mình quen nhau không anh ?");
    } else if (message.content.toLowerCase().includes("anh qua chơi")) {
      Log.send("*call 911");
    }
  }
});

client.login(token);
