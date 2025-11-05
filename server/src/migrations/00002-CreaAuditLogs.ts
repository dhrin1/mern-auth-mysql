// import { MigrationInterface, QueryRunner, Table } from "typeorm";

// export class CreateAuditLogTable0000000000002 implements MigrationInterface {
//   public async up(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.createTable(
//       new Table({
//         name: "audit_log",
//         columns: [
//           {
//             name: "id",
//             type: "int",
//             isPrimary: true,
//             isGenerated: true,
//             generationStrategy: "increment",
//           },
//           {
//             name: "userId",
//             type: "int",
//           },
//           {
//             name: "action",
//             type: "varchar",
//             length: "50",
//           },
//           {
//             name: "description",
//             type: "text",
//             isNullable: true,
//           },
//           {
//             name: "ipAddress",
//             type: "varchar",
//             length: "45",
//             isNullable: true,
//           },
//           {
//             name: "userAgent",
//             type: "varchar",
//             length: "500",
//             isNullable: true,
//           },
//           {
//             name: "timestamp",
//             type: "timestamp",
//             default: "CURRENT_TIMESTAMP",
//           },
//         ],
//         foreignKeys: [
//           {
//             columnNames: ["userId"],
//             referencedTableName: "user",
//             referencedColumnNames: ["id"],
//             onDelete: "CASCADE",
//           },
//         ],
//       }),
//       true
//     );

//     // Create indexes for better query performance
//     await queryRunner.query(`
//       CREATE INDEX IDX_AUDIT_LOG_USER_ID ON audit_log (userId)
//     `);

//     await queryRunner.query(`
//       CREATE INDEX IDX_AUDIT_LOG_ACTION ON audit_log (action)
//     `);

//     await queryRunner.query(`
//       CREATE INDEX IDX_AUDIT_LOG_TIMESTAMP ON audit_log (timestamp)
//     `);
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_USER_ID ON audit_log`);
//     await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_ACTION ON audit_log`);
//     await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_TIMESTAMP ON audit_log`);

//     await queryRunner.dropTable("audit_log");
//   }
// }

// src/migrations/00002-CreateAuditLogTable.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAuditLogTable0000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audit_log",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "user_id", // Changed from userId to user_id
            type: "int",
          },
          {
            name: "action",
            type: "varchar",
            length: "50",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "ip_address", // Changed from ipAddress to ip_address
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "user_agent", // Changed from userAgent to user_agent
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "timestamp",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["user_id"], // Updated to match column name change
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IDX_AUDIT_LOG_USER_ID ON audit_log (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_AUDIT_LOG_ACTION ON audit_log (action)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_AUDIT_LOG_TIMESTAMP ON audit_log (timestamp)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_USER_ID ON audit_log`);
    await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_ACTION ON audit_log`);
    await queryRunner.query(`DROP INDEX IDX_AUDIT_LOG_TIMESTAMP ON audit_log`);

    await queryRunner.dropTable("audit_log");
  }
}
