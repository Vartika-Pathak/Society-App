import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  maintenanceRequestsTable,
  usersTable,
  type MaintenanceRequest,
  type User,
} from "@workspace/db";
import {
  CreateMaintenanceRequestBody,
  UpdateMaintenanceStatusParams,
  UpdateMaintenanceStatusBody,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";
import { uploadImages, uploadedFileUrls, deleteUploadedFiles } from "../lib/uploads";

const router: IRouter = Router();

function toMaintenanceRequest(request: MaintenanceRequest, resident: Pick<User, "name" | "flatNumber">) {
  return {
    id: request.id,
    category: request.category,
    description: request.description,
    photoUrls: request.photoUrls,
    status: request.status,
    residentName: resident.name,
    residentFlatNumber: resident.flatNumber,
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
    .select({ request: maintenanceRequestsTable, resident: usersTable })
    .from(maintenanceRequestsTable)
    .innerJoin(usersTable, eq(maintenanceRequestsTable.residentId, usersTable.id))
    .where(canSeeAll ? undefined : eq(maintenanceRequestsTable.residentId, user.id))
    .orderBy(desc(maintenanceRequestsTable.createdAt));

  res.status(200).json(rows.map(({ request, resident }) => toMaintenanceRequest(request, resident)));
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
      category: parsed.data.category,
      description: parsed.data.description,
      photoUrls: uploadedFileUrls(files),
    })
    .returning();

  res.status(201).json(toMaintenanceRequest(request, user));
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

  const [row] = await db
    .select({ request: maintenanceRequestsTable, resident: usersTable })
    .from(maintenanceRequestsTable)
    .innerJoin(usersTable, eq(maintenanceRequestsTable.residentId, usersTable.id))
    .where(eq(maintenanceRequestsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db
    .update(maintenanceRequestsTable)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(maintenanceRequestsTable.id, params.data.id))
    .returning();

  res.status(200).json(toMaintenanceRequest(updated, row.resident));
});

export default router;
