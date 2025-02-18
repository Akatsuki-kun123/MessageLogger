import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("danbooru")
    .setDescription("Search for a character on Danbooru")
    .addStringOption((option) =>
      option
        .setName("character")
        .setDescription("Character name (e.g., rem_(re:zero))")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("help_danbooru")
    .setDescription("Get help with the Danbooru command"),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.token);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(Routes.applicationCommands(process.env.client_id), {
    body: commands,
  });

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}
