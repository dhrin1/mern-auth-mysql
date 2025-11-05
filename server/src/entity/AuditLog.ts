import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum AuditAction {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  PROFILE_UPDATE = "PROFILE_UPDATE",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  LOGOUT = "LOGOUT",
}

@Entity("audit_log")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({
    type: "varchar",
    length: 50,
  })
  action: AuditAction;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "varchar", length: 500, nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: "timestamp" })
  timestamp: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
