import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mern_auth",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "entity/**/*.ts")],
  migrations: [path.join(__dirname, "migrations/**/*.ts")],
  subscribers: [],
});

export default AppDataSource;
