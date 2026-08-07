import type { Request, Response, NextFunction } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { getAuthedUser } from "../lib/auth";
import { logger } from "../lib/logger";

const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Skips auth/session and the audit log's own read endpoint — everything else that
// mutates state (Masters, Transactions, Notices, Society Rules, Services, ...) gets
// logged automatically here rather than needing a call added at every route.
const SKIP_PATH_PREFIXES = ["/auth", "/audit-logs"];

const VERB_LABELS: Record<string, string> = {
  POST: "Created",
  PUT: "Updated",
  PATCH: "Updated",
  DELETE: "Deleted",
};

function resourceNameFromPath(path: string): string {
  const segment = path.split("/").filter(Boolean)[0];
  return segment ?? path;
}

function labelFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  for (const key of ["name", "title", "billNumber", "flatNumber", "email"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  if (typeof record.id === "number") return `#${record.id}`;
  return null;
}

export function auditLogMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!AUDITED_METHODS.has(req.method) || SKIP_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
      next();
      return;
    }

    const user = await getAuthedUser(req);
    if (!user) {
      next();
      return;
    }

    const originalSend = res.send.bind(res);
    res.send = ((body?: unknown) => {
      if (res.statusCode < 300) {
        let parsedBody: unknown = body;
        if (typeof body === "string" && body.length > 0) {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            parsedBody = undefined;
          }
        }

        const resource = resourceNameFromPath(req.path);
        const verb = VERB_LABELS[req.method] ?? req.method;
        const label = labelFromBody(parsedBody) ?? (req.params.id ? `#${req.params.id}` : "");
        const summary = `${verb} ${resource}${label ? ` (${label})` : ""}`;

        db.insert(auditLogsTable)
          .values({
            adminId: user.id,
            adminName: user.name,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            summary,
          })
          .catch((err) => logger.error({ err }, "Failed to write audit log"));
      }

      return originalSend(body);
    }) as Response["send"];

    next();
  };
}
