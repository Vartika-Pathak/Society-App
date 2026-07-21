import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, complaintsTable, usersTable, type Complaint, type User } from "@workspace/db";
import {
  CreateComplaintBody,
  ListComplaintsResponse,
  CreateComplaintResponse,
  UpdateComplaintStatusParams,
  UpdateComplaintStatusBody,
  UpdateComplaintStatusResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toComplaint(complaint: Complaint, resident: Pick<User, "name" | "flatNumber">) {
  return {
    id: complaint.id,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    resolutionNote: complaint.resolutionNote,
    residentName: resident.name,
    residentFlatNumber: resident.flatNumber,
    createdAt: complaint.createdAt.toISOString(),
  };
}

router.get("/complaints", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const canSeeAll = user.role === "guard" || user.role === "admin";

  const rows = await db
    .select({ complaint: complaintsTable, resident: usersTable })
    .from(complaintsTable)
    .innerJoin(usersTable, eq(complaintsTable.residentId, usersTable.id))
    .where(canSeeAll ? undefined : eq(complaintsTable.residentId, user.id))
    .orderBy(desc(complaintsTable.createdAt));

  res.status(200).json(ListComplaintsResponse.parse(rows.map(({ complaint, resident }) => toComplaint(complaint, resident))));
});

router.post("/complaints", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [complaint] = await db
    .insert(complaintsTable)
    .values({
      residentId: user.id,
      category: parsed.data.category,
      description: parsed.data.description,
    })
    .returning();

  res.status(201).json(CreateComplaintResponse.parse(toComplaint(complaint, user)));
});

router.post("/complaints/:id/status", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "guard" && user.role !== "admin") {
    res.status(403).json({ error: "Only guards and admins can update complaint status" });
    return;
  }

  const params = UpdateComplaintStatusParams.safeParse(req.params);
  const body = UpdateComplaintStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)?.message });
    return;
  }

  const [row] = await db
    .select({ complaint: complaintsTable, resident: usersTable })
    .from(complaintsTable)
    .innerJoin(usersTable, eq(complaintsTable.residentId, usersTable.id))
    .where(eq(complaintsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set({
      status: body.data.status,
      resolutionNote: body.data.resolutionNote ?? row.complaint.resolutionNote,
      updatedAt: new Date(),
    })
    .where(eq(complaintsTable.id, params.data.id))
    .returning();

  res.status(200).json(UpdateComplaintStatusResponse.parse(toComplaint(updated, row.resident)));
});

export default router;
