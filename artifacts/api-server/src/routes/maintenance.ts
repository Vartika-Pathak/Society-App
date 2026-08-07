import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, maintenanceRequestsTable, type MaintenanceRequest } from "@workspace/db";
import {
  CreateMaintenanceRequestBody,
  UpdateMaintenanceStatusParams,
  UpdateMaintenanceStatusBody,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";
import { uploadImages, uploadedFileUrls, deleteUploadedFiles } from "../lib/uploads";

const router: IRouter = Router();

function toMaintenanceRequest(request: MaintenanceRequest) {
  return {
    id: request.id,
    category: request.category,
    description: request.description,
    photoUrls: request.photoUrls,
    status: request.status,
    residentName: request.residentName,
    residentFlatNumber: request.residentFlatNumber,
    createdAt: request.createdAt.toISOString(),
  };
}

router.get("/maintenance", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const canSeeAll = user.role === "guard" || user.role === "admin";

  const rows = await db
    .select()
    .from(maintenanceRequestsTable)
    .where(canSeeAll ? undefined : eq(maintenanceRequestsTable.residentId, user.id))
    .orderBy(desc(maintenanceRequestsTable.createdAt));

  res.status(200).json(rows.map(toMaintenanceRequest));
});

router.post("/maintenance", uploadImages.array("photos", 6), async (req, res): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;

  const user = await getAuthedUser(req);
  if (!user) {
    deleteUploadedFiles(files);
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = CreateMaintenanceRequestBody.safeParse(req.body);
  if (!parsed.success) {
    deleteUploadedFiles(files);
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db
    .insert(maintenanceRequestsTable)
    .values({
      residentId: user.id,
      residentName: user.name,
      residentFlatNumber: user.flatNumber,
      category: parsed.data.category,
      description: parsed.data.description,
      photoUrls: uploadedFileUrls(files),
    })
    .returning();

  res.status(201).json(toMaintenanceRequest(request));
});

router.post("/maintenance/:id/status", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "guard" && user.role !== "admin") {
    res.status(403).json({ error: "Only guards and admins can update request status" });
    return;
  }

  const params = UpdateMaintenanceStatusParams.safeParse(req.params);
  const body = UpdateMaintenanceStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)?.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(maintenanceRequestsTable)
    .where(eq(maintenanceRequestsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db
    .update(maintenanceRequestsTable)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(maintenanceRequestsTable.id, params.data.id))
    .returning();

  res.status(200).json(toMaintenanceRequest(updated));
});

export default router;
