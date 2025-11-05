// src/run-migrations.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const AppDataSource = new DataSource({
  type: "mysql" as const,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mern_auth",
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, "entity/**/*.ts")],
  migrations: [path.join(__dirname, "migrations/**/*.ts")],
});

async function runMigrations() {
  try {
    await AppDataSource.initialize();

    const pendingMigrations = await AppDataSource.showMigrations();

    if (!pendingMigrations) {
      console.log("No pending migrations found");
    } else {
      console.log("Running pending migrations...");
      const migrations = await AppDataSource.runMigrations();

      console.log(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }
    await AppDataSource.destroy();
    console.log("Migration process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
