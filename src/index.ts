import {
  ApplicationCommandType,
  ButtonStyle,
  ChannelType,
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  TextInputStyle,
} from "discord.js";
import environment from "./env";
import { Config, Verifications } from "./db";
import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";

const client = new Client({
  intents: [GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  Verifications.sync({ alter: true });
  Config.sync({ alter: true });
  console.log("ready!");
});

client.login(environment.token);

client.on("messageCreate", async (message) => {
  if (!message.author.bot && message.channel.type === ChannelType.DM) {
    const verificationImage = message.attachments.first();
    if (!verificationImage) {
      message.reply("Please send a screenshot of your portal to verify.");
      return;
    }

    if (!verificationImage.contentType?.startsWith("image")) {
      await message.reply("what the fuck is this");
      await message.reply("please send an image lol");
      return;
    }

    const userMessageContent = message.content
      ? `They said:\n\n >>> ${message.content}`
      : "";

    const embed = new EmbedBuilder()
      .setColor(0x00a8e1)
      .setTitle(`Member is requesting verification`)
      .setDescription(
        `<@${message.author.id}> requested verification. ${userMessageContent}`
      )
      .setImage(verificationImage?.url ?? "https://placekitten.com/800/800")
      .addFields({
        name: "Account created",
        value: `<t:${Math.floor(message.author.createdAt.getTime() / 1000)}:R>`,
      })
      .addFields({
        name: "Previously verified at",
        value: "never verified",
      });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verifyIntern-${message.author.id}`)
        .setStyle(ButtonStyle.Primary)
        .setLabel("Verify - Intern"),
      new ButtonBuilder()
        .setCustomId(`verifyFt-${message.author.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Verify - FullTime"),
      new ButtonBuilder()
        .setCustomId(`deny-${message.author.id}`)
        .setStyle(ButtonStyle.Danger)
        .setLabel("Reject")
    );

    const targetChannelId = await Config.findOne({
      where: { key: "channel" },
    }).then((d) => d?.toJSON().value);

    const channel = (await client.channels.fetch(
      targetChannelId
    )) as TextChannel;

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await message.reply(
      "Your verification has been forwarded to the admins, we'll let you know when it's processed."
    );

    return;
  }
});

/**
 * Button handler
 */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  console.log({ interaction });

  const [interactionName, interactionId] = interaction.customId.split("-");

  const modal = new ModalBuilder();

  const reasonInput = new TextInputBuilder()
    .setLabel("Add a reason (if you want)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  if (interactionName === "verifyIntern") {
    modal
      .setTitle(
        `Verify ${
          (await client.users.fetch(interactionId))?.tag ?? "unknown"
        } as an intern?`
      )
      .setCustomId(`internVerifyReason-${interactionId}`);

    reasonInput.setCustomId("reason");
  } else if (interactionName === "verifyFt") {
    modal
      .setTitle(
        `Verify ${
          (await client.users.fetch(interactionId))?.tag ?? "unknown"
        } as full time?`
      )
      .setCustomId(`ftVerifyReason-${interactionId}`);

    reasonInput.setCustomId("reason");
  } else if (interactionName === "deny") {
    modal
      .setTitle(
        `Reject ${
          (await client.users.fetch(interactionId))?.tag ?? "unknown"
        }'s verification request?`
      )
      .setCustomId(`denyReason-${interactionId}`);

    reasonInput.setCustomId("reason");
  }

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
    reasonInput
  );

  modal.addComponents(row);

  return await interaction.showModal(modal);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const [interactionName, interactionId] = interaction.customId.split("-");

  if (interactionName.includes("Reason")) {
    const embed = new EmbedBuilder();

    const reason = interaction.fields.getTextInputValue("reason");
    if (reason) embed.setDescription(reason);
    const reasonContext = reason ? ` with reason:\n>>> ${reason}` : "!";

    if (interaction.customId.startsWith("internVerifyReason")) {
      embed
        .setColor(0x00a8e1)
        .setTitle("You're verified!")
        .addFields({ name: "Role", value: "Intern" });

      await interaction.reply({
        content: `Verified${reasonContext}`,
      });
    } else if (interaction.customId.startsWith("ftVerifyReason")) {
      embed
        .setColor(0xff9900)
        .setTitle("You're verified!")
        .addFields({ name: "Role", value: "Full Time" });
      await interaction.reply({
        content: `Verified${reasonContext}`,
      });
    } else if (interaction.customId.startsWith("denyReason")) {
      embed
        .setColor(0xff0000)
        .setTitle("Verification rejected.")
        .addFields({ name: "Role", value: ":skull:" });
      await interaction.reply({
        content: `Rejected${reasonContext}`,
      });
    }

    const user = await client.users.fetch(interactionId);
    await user.send({
      embeds: [embed],
    });
    return;
  }
});

client.on("interactionCreate", async (interaction) => {
  if (
    !interaction.isCommand() ||
    interaction.commandType !== ApplicationCommandType.ChatInput
  )
    return;

  if (interaction.commandName === "config") {
    if (interaction.options.getSubcommand() === "channel") {
      const channelRecord = await Config.findOne({ where: { key: "channel" } });
      const channelData = interaction.options.getChannel("channel", true);
      if (channelRecord) {
        channelRecord.update({
          value: channelData.id,
        });
      } else {
        await Config.create({
          key: "channel",
          value: channelData.id,
        });
      }

      interaction.reply({
        content: `Updated verification channel to <#${channelData.id}>`,
      });
    }
  }
});
