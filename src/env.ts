import { envsafe, str } from "envsafe";
import { config } from "dotenv";
config();

const env = envsafe({
  TOKEN: str(),
  CLIENT_ID: str(),
  GUILD_ID: str(),
});

export default {
  token: env.TOKEN,
  clientId: env.CLIENT_ID,
  guildIds: env.GUILD_ID.split(","),
};
