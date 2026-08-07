import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable, type Service } from "@workspace/db";
import {
  ListServicesResponse,
  CreateServiceBody,
  CreateServiceResponse,
  UpdateServiceBody,
  UpdateServiceResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toService(row: Service) {
  return { id: row.id, name: row.name, category: row.category, contactNumber: row.contactNumber, notes: row.notes };
}

router.get("/services", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view services" });
    return;
  }

  const rows = await db.select().from(servicesTable);
  res.status(200).json(ListServicesResponse.parse(rows.map(toService)));
});

router.post("/services", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add services" });
    return;
  }

  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(servicesTable).values(parsed.data).returning();
  res.status(201).json(CreateServiceResponse.parse(toService(created)));
});

router.put("/services/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update services" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(servicesTable).set(parsed.data).where(eq(servicesTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.status(200).json(UpdateServiceResponse.parse(toService(updated)));
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete services" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.status(204).send();
});

export default router;
