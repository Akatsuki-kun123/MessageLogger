const fs = require("fs");
require("dotenv").config();

const { findTagByWords } = require("./bot_func/fuzzy_search/searchFunc.js");

const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { Client, Events, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env["token"];

//Login status
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

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

//search danbooru
async function searchDanbooru(characterName) {
  let url = "";
  let post;
  if (!characterName) {
    let random_id = Math.floor(Math.random() * 10000) + 1;
    url = `https://danbooru.donmai.us/posts/${random_id}.json`;
  } else {
    url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(
      characterName
    )}+order:random&limit=1`;
  }

  try {
    const response = await fetch(url);
    const posts = await response.json();

    if (characterName) {
      if (posts.length == 0) {
        return null;
      }

      post = posts[0];
    } else {
      if (!posts) {
        return null;
      }

      post = posts;
    }

    return {
      id: post.id,
      imageUrl: post.file_url,
      postUrl: `https://danbooru.donmai.us/posts/${post.id}`,
      artist: post.tag_string_artist.replace(/[_*~`]/g, "\\$&"),
      character: post.tag_string_character.replace(/[_*~`]/g, "\\$&"),
    };
  } catch (error) {
    console.error("Danbooru API error:", error);
    return null;
  }
}

//build danbooru embed
function buildDanbooruEmbed(post) {
  return new EmbedBuilder()
    .setTitle("Danbooru Image")
    .setColor("#FFD700")
    .setImage(post.imageUrl)
    .setURL(post.postUrl)
    .addFields(
      { name: "Artist", value: post.artist },
      { name: "Character", value: post.character }
    );
}

//find danbooru tag
/*
async function findDanbooruTag(tagName, category) {
  let url = "";
  if (category) {
    url = `https://danbooru.donmai.us/tags.json?search[name_matches]=*${encodeURIComponent(
      tagName
    )}*&search[order]=count&search[category]=${category}&search[post_count_gt]=0&limit=20`;
  } else {
    url = `https://danbooru.donmai.us/tags.json?search[name_matches]=*${encodeURIComponent(
      tagName
    )}*&search[order]=count&search[post_count_gt]=0&limit=20`;
  }

  try {
    const response = await fetch(url);
    const tags = await response.json();

    if (!tags || tags.length == 0) {
      return null;
    }

    return tags.map((tag) => ({
      name: tag.name.replace(/[_*~`]/g, "\\$&"),
      category: tag.category,
      postCount: tag.post_count,
    }));
  } catch (error) {
    console.error("Error fetching Danbooru tags:", error);
    return null;
  }
}
*/

//build danbooru tag embed
function buildDanbooruTagEmbed(tags, searchQuery) {
  let embed = new EmbedBuilder()
    .setTitle(`🔍 Danbooru Tag Search for **${searchQuery}**`)
    .setColor("#FF8C00");

  tags.map((tag) => {
    const categoryNames = {
      0: "General",
      1: "Artist",
      3: "Copyright",
      4: "Character",
      5: "Meta",
    };
    embed.addFields({
      name: `**${tag.name.replace(/_/g, "\\_")}**`,
      value: `Category: **${
        categoryNames[tag.category] || "Unknown"
      }**\nPosts: **${tag.postCount}**`,
      inline: false,
    });
  });

  return embed;
}

//interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName == "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName == "danbooru") {
    const character = interaction.options
      .getString("character")
      .replace(/\s+/g, "_")
      .toLowerCase();
    const result = await searchDanbooru(character);

    if (!result) {
      await interaction.reply(
        `Có vẻ không tìm được post có gắn tag **${character}** ┐(￣ ヘ￣)┌.`
      );
    } else {
      let reply = buildDanbooruEmbed(result);
      await interaction.reply({ embeds: [reply] });
    }
  } else if (interaction.commandName == "help_danbooru") {
    await interaction.reply(
      "Để kiếm ảnh từ Danbooru, gõ `/danbooru character:<tên_character>` là được ( ˘▽˘)っ."
    );
  } else if (interaction.commandName == "help") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Command List")
      .setColor(0x0099ff)
      .setDescription("Đây là cách xài bot nè mấy đứa ( ๑‾̀◡‾́)σ.")
      .setFooter({ text: "Nếu muốn gọi lệnh '/' thì check `/help_danbooru`" })
      .setTimestamp();
    embed.addFields(
      {
        name: "🔍 Danbooru Commands",
        value:
          "`!danbooru` - Lấy ảnh random\n" +
          "`!danbooru!tag <tag_name>` - Lấy ảnh có kèm theo tag\n" +
          "`!find <tag_name>` - Tìm kiếm tag dựa trên tên nhân vật\n",
        inline: false,
      },
      {
        name: "🎮 General Bot Commands",
        value:
          "`/ping` - Check bot latency\n" +
          "`/about` - Get bot info\n" +
          "`/help` - Show this help menu",
        inline: false,
      }
    );

    await interaction.reply({ embeds: [embed] });
  }
});

//get danbooru image
client.on("messageCreate", async (message) => {
  const tags = ["rem_(re:zero)", "hatsune_miku", "maid", "blue_hair"];

  if (message.author.bot) return;

  const PREFIX = "!danbooru";
  const PREFIX_FIND_TAG = "!find";
  const PREFIX_WITH_TAG = "!danbooru!tag";

  const PREFIX_REFRESH_TAGS = "!refresh";

  if (message.content.startsWith(PREFIX)) {
    if (message.content.startsWith(PREFIX_WITH_TAG)) {
      has_tag = true;
      let [command, ...tag] = message.content
        .toLowerCase()
        .split(" ")
        .map((s) => s.trim());

      if (tag.length >= 1 && tag[0]) {
        tag = tag.join("_").replace(/\s+/g, "_").toLowerCase();

        let result = await searchDanbooru(tag);
        if (!result) {
          message.channel.send(
            `Có vẻ không tìm được post có gắn tag **${tag}** ┐(￣ ヘ￣)┌.`
          );
        } else {
          let reply = buildDanbooruEmbed(result);
          message.channel.send({ embeds: [reply] });
        }
      } else {
        message.channel.send(
          "Bà mẹ chú gõ sai lệnh rồi (˵¯͒ ▂¯͒˵)! Nó phải như này này (¬▂¬) : `!danbooru!tag danboo`"
        );
      }
    } else {
      let result = await searchDanbooru();
      if (!result) {
        message.channel.send("Có vẻ không tìm được post nào cả (˵¯͒ ▂¯͒˵).");
      } else {
        let reply = buildDanbooruEmbed(result);
        message.channel.send({ embeds: [reply] });
      }
    }
  } else if (message.content.toLowerCase().startsWith(PREFIX_FIND_TAG)) {
    let [command, ...searchQuery] = message.content
      .toLowerCase()
      .split(" ")
      .map((s) => s.trim());

    let category = null;
    if (searchQuery.length > 1) {
      let lastElem = searchQuery[searchQuery.length - 1];
      if (!isNaN(lastElem)) {
        category = searchQuery.pop();
      }
    }

    if (searchQuery.length >= 1 && searchQuery[0]) {
      searchQuery = searchQuery.join("_").replace(/\s+/g, "_").toLowerCase();

      //let result = await findDanbooruTag(searchQuery, category);
      let result = findTagByWords(searchQuery, undefined, undefined, category);
      if (!result) {
        message.channel.send(
          `Có vẻ không tìm được tag nào giống cái này rồi ᇂ_ᇂ.`
        );
      } else {
        let reply = buildDanbooruTagEmbed(result, searchQuery);
        message.channel.send({ embeds: [reply] });
      }
    } else {
      return message.channel.send(
        "Bà mẹ chú gõ sai lệnh rồi (˵¯͒ ▂¯͒˵)! Nó phải như này này (¬▂¬) : `!find cute`"
      );
    }
  } else if (message.content.toLowerCase().startsWith(PREFIX_REFRESH_TAGS)) {
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

//Log deleted message
/*
const snipes = new Discord.Collection();

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
*/

client.login(token);
