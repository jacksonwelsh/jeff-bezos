import { Sequelize, STRING, ENUM, TIME } from "sequelize";

export const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

export const Verifications = sequelize.define("verifications", {
  userId: STRING,
  userSnowflake: STRING,
  verifiedAt: TIME,
  verifiedRole: ENUM("intern", "fulltime", "other"),
});

export const Config = sequelize.define("config", {
  key: STRING,
  value: STRING,
});
