import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, complaintsTable, type Complaint } from "@workspace/db";
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

function toComplaint(complaint: Complaint) {
  return {
    id: complaint.id,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    resolutionNote: complaint.resolutionNote,
    residentName: complaint.residentName,
    residentFlatNumber: complaint.residentFlatNumber,
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
    .select()
    .from(complaintsTable)
    .where(canSeeAll ? undefined : eq(complaintsTable.residentId, user.id))
    .orderBy(desc(complaintsTable.createdAt));

  res.status(200).json(ListComplaintsResponse.parse(rows.map(toComplaint)));
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
      residentName: user.name,
      residentFlatNumber: user.flatNumber,
      category: parsed.data.category,
      description: parsed.data.description,
    })
    .returning();

  res.status(201).json(CreateComplaintResponse.parse(toComplaint(complaint)));
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

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set({
      status: body.data.status,
      resolutionNote: body.data.resolutionNote ?? existing.resolutionNote,
      updatedAt: new Date(),
    })
    .where(eq(complaintsTable.id, params.data.id))
    .returning();

  res.status(200).json(UpdateComplaintStatusResponse.parse(toComplaint(updated)));
});

export default router;
