// src/migrations/00001-CreateAuthTables.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAuthTables0000000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.createTable(
      new Table({
        name: "user",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create refresh_token table with EXACT column names
    await queryRunner.createTable(
      new Table({
        name: "refresh_token",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "token",
            type: "varchar",
            length: "500",
          },
          {
            name: "user_id", // MUST be snake_case
            type: "int",
          },
          {
            name: "expires_at", // MUST be snake_case
            type: "datetime",
          },
          {
            name: "created_at", // MUST be snake_case
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["user_id"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("refresh_token");
    await queryRunner.dropTable("user");
  }
}
