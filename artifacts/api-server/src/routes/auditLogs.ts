import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogsTable, type AuditLog } from "@workspace/db";
import { ListAuditLogsResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toAuditLog(row: AuditLog) {
  return {
    id: row.id,
    adminId: row.adminId,
    adminName: row.adminName,
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/audit-logs", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view audit logs" });
    return;
  }

  const rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(500);
  res.status(200).json(ListAuditLogsResponse.parse(rows.map(toAuditLog)));
});

export default router;
