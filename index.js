import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function searchDanbooru(characterName) {
  const url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(
    characterName
  )}&limit=1`;
  try {
    console.log("Fetching Danbooru API:", url);
    const response = await fetch(url);
    const posts = await response.json();
    if (posts.length === 0) return null;

    return {
      id: posts[0].id,
      imageUrl: posts[0].file_url,
      postUrl: `https://danbooru.donmai.us/posts/${posts[0].id}`,
    };
  } catch (error) {
    console.error("Danbooru API error:", error);
    return null;
  }
}

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName == "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName == "danbooru") {
    const character = interaction.options.getString("character");
    const result = await searchDanbooru(character);

    if (!result) {
      await interaction.reply(`No results found for **${character}**.`);
    } else {
      await interaction.reply(
        `🔗 [View Post](${result.postUrl})\n🖼 ${result.imageUrl}`
      );
    }
  }
});

client.login(process.env.token);
