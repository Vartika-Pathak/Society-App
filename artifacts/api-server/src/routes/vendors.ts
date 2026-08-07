import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vendorsTable, type Vendor } from "@workspace/db";
import {
  ListVendorsResponse,
  CreateVendorBody,
  CreateVendorResponse,
  UpdateVendorBody,
  UpdateVendorResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toVendor(row: Vendor) {
  return {
    id: row.id,
    name: row.name,
    contactPersonName: row.contactPersonName,
    contactNumber: row.contactNumber,
    address: row.address,
    gstNumber: row.gstNumber,
    openingBalancePaise: row.openingBalancePaise,
  };
}

router.get("/vendors", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view vendors" });
    return;
  }

  const rows = await db.select().from(vendorsTable);
  res.status(200).json(ListVendorsResponse.parse(rows.map(toVendor)));
});

router.post("/vendors", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add vendors" });
    return;
  }

  const parsed = CreateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(vendorsTable).values(parsed.data).returning();
  res.status(201).json(CreateVendorResponse.parse(toVendor(created)));
});

router.put("/vendors/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update vendors" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(vendorsTable).set(parsed.data).where(eq(vendorsTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.status(200).json(UpdateVendorResponse.parse(toVendor(updated)));
});

router.delete("/vendors/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete vendors" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(vendorsTable).where(eq(vendorsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.status(204).send();
});

export default router;
