import { AppDataSource } from "../data-source";
import { AuditLog, AuditAction } from "../entity/AuditLog";
import { Request } from "express";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

export class AuditService {
  // Log an audit event
  static async logEvent(
    userId: number,
    action: AuditAction,
    description?: string,
    req?: Request
  ): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.userId = userId;
      auditLog.action = action;

      if (description) {
        auditLog.description = description;
      }

      if (req) {
        auditLog.ipAddress = this.getClientIp(req);
        auditLog.userAgent = req.get("User-Agent") || "Unknown";
      }

      await auditLogRepository.save(auditLog);
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  }

  // Get client IP address from request
  private static getClientIp(req: Request): string {
    let ip =
      req.ip ||
      (req.connection as any).remoteAddress ||
      (req.socket as any).remoteAddress ||
      "Unknown";

    return ip.replace(/^::ffff:/, "");
  }

  // Get audit logs for a user
  static async getUserAuditLogs(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const [logs, total] = await auditLogRepository.findAndCount({
        where: { userId },
        order: { timestamp: "DESC" },
        take: limit,
        skip: offset,
        relations: ["user"],
      });

      return { logs, total };
    } catch (error) {
      console.error("Error getting user audit logs:", error);
      return { logs: [], total: 0 };
    }
  }

  // Get all audit logs with pagination
  static async getAllAuditLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const [logs, total] = await auditLogRepository.findAndCount({
        order: { timestamp: "DESC" },
        take: limit,
        skip: offset,
        relations: ["user"],
      });

      return { logs, total };
    } catch (error) {
      console.error("Error getting all audit logs:", error);
      return { logs: [], total: 0 };
    }
  }

  // Search audit logs by action or description
  static async searchAuditLogs(
    searchTerm: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const queryBuilder = auditLogRepository
        .createQueryBuilder("auditLog")
        .leftJoinAndSelect("auditLog.user", "user")
        .where("auditLog.action LIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orWhere("auditLog.description LIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orWhere("user.email LIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orderBy("auditLog.timestamp", "DESC")
        .take(limit)
        .skip(offset);

      const [logs, total] = await queryBuilder.getManyAndCount();
      return { logs, total };
    } catch (error) {
      console.error("Error searching audit logs:", error);
      return { logs: [], total: 0 };
    }
  }

  // Get login statistics for a user
  static async getUserLoginStats(userId: number): Promise<{
    totalLogins: number;
    lastLogin: Date | null;
    failedAttempts: number;
  }> {
    try {
      const totalLogins = await auditLogRepository.count({
        where: {
          userId,
          action: AuditAction.LOGIN_SUCCESS,
        },
      });

      const lastLogin = await auditLogRepository.findOne({
        where: {
          userId,
          action: AuditAction.LOGIN_SUCCESS,
        },
        order: { timestamp: "DESC" },
      });

      const failedAttempts = await auditLogRepository.count({
        where: {
          userId,
          action: AuditAction.LOGIN_FAILED,
        },
      });

      return {
        totalLogins,
        lastLogin: lastLogin ? lastLogin.timestamp : null,
        failedAttempts,
      };
    } catch (error) {
      console.error("Error getting user login stats:", error);
      return {
        totalLogins: 0,
        lastLogin: null,
        failedAttempts: 0,
      };
    }
  }
}
