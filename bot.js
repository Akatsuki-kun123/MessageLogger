const fs = require('fs');
require('dotenv').config();

const Discord = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');

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

const token = process.env['token'];
const snipes = new Discord.Collection();

//Login status
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'hey') {
    await interaction.reply('Yes?');
  }
});

//change status
var status = "online";
function change_status(stat, file) {
  fs.open(file, 'r+', function(err, fd) {
    if (err) {
      return console.error(err);
    }
    
    fs.writeFile(file, stat,  function(err) {
      if (err) {
        return console.error(err);
      }
    });

    fs.close(fd, function(err){
      if (err){
        console.log(err);
      } 
    });
  });
}

//Log deleted message
client.on('messageDelete', (message) => {
  snipes.set(message.channel.id, message);
  const LogChannel = client.channels.cache.get('1031584758460862495');

  if (message.author.id == 596283000023416852) {
    LogChannel.send("Bí mật của chồng, không ai được biết.");
    return 0;
  } else if (message.author.id == 1027765339389431828 || message.author.id == 571027211407196161) {
    return 0;
  } else if (message.author.id == 1012001069267681320) {
    LogChannel.send(`Bé ${message.author} đáng yêu quá chị ko nỡ (>.<")`);
    return 0;
  }
  
  try{
    const DeletedLog = new EmbedBuilder()
      .setTitle("Deleted Message")
      .addFields({name: 'Deleted by', value: `${message.author} - (${message.author.id})`})
      .addFields({name: 'In', value: message.channel.name})
      .setColor('#FF0000')
      .setThumbnail(message.author.displayAvatarURL({dynamic: true}));
    
    if (message.content) {
      DeletedLog.addFields({name: 'Content', value: message.content})
    }
    if (message.attachments.first()) {
      DeletedLog.setImage(message.attachments.first().url);
      if (message.attachments.first().url) {
        DeletedLog.addFields({name: 'Ps', value: 'Có cái gì đó susy mà bé không đọc được!'})
      }
    } else {
      DeletedLog.addFields({name: 'Ps', value: 'No attachments'})
    }
  
    LogChannel.send({ embeds: [DeletedLog] });
  }
  catch(error){
    console.log(error);
  }
});

//message handler
client.on('messageCreate', (message) => {
  const Log = client.channels.cache.get(message.channel.id);

  //admin mention
  if (message.content.toLowerCase().includes('vợ bách')) {
    Log.send("Hả anh còn con nào ngoài tôi? -_-");
  } else if (message.content.includes('<@596283000023416852>')) {
      if (fs.readFileSync("akat_status.txt", 'utf8') == "offline") {
        Log.send("Chồng em đang không có nhà better call back saul! (m_ _m)")
      }
  }

  //gacha
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
    } else if (message.content.toLowerCase().includes("trốn vợ chơi game thôi")) {
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