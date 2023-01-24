import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import environment from "./env";

const { clientId, token } = environment;

const commands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Manage the bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Set the verification channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Where verification requests should be routed")
            .setRequired(true)
        )
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log("Successfully registered application commands"))
  .catch(console.error);
