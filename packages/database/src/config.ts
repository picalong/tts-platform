import "reflect-metadata";
import { DataSource } from "typeorm";
import { UserEntity } from "./entities/UserEntity";
import { TtsJobEntity } from "./entities/TtsJobEntity";
import { VoiceEntity } from "./entities/VoiceEntity";
import { CreditTransactionEntity } from "./entities/CreditTransactionEntity";
import * as path from "path";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.MYSQL_HOST ?? "localhost",
  port: Number(process.env.MYSQL_PORT) ?? 3306,
  username: process.env.MYSQL_USER ?? "tts_user",
  password: process.env.MYSQL_PASSWORD ?? "tts_password",
  database: process.env.MYSQL_DATABASE ?? "tts_saas",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  timezone: "+00:00",
  entities: [UserEntity, TtsJobEntity, VoiceEntity, CreditTransactionEntity],
  migrations: [path.join(__dirname, "migrations", "*{.ts,.js}")],
  migrationsRun: true,
  subscribers: [],
});
