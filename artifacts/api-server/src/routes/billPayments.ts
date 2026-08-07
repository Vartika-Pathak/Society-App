import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, billPaymentsTable, vendorBillsTable, type BillPayment } from "@workspace/db";
import { ListBillPaymentsResponse, CreateBillPaymentBody, CreateBillPaymentResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toBillPayment(row: BillPayment) {
  return {
    id: row.id,
    vendorBillId: row.vendorBillId,
    amountPaise: row.amountPaise,
    paymentDate: row.paymentDate,
    paymentMode: row.paymentMode,
    referenceNumber: row.referenceNumber,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/bill-payments", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view bill payments" });
    return;
  }

  const vendorBillId = req.query.vendorBillId ? Number(req.query.vendorBillId) : undefined;
  const rows = await db
    .select()
    .from(billPaymentsTable)
    .where(vendorBillId !== undefined ? eq(billPaymentsTable.vendorBillId, vendorBillId) : undefined);

  res.status(200).json(ListBillPaymentsResponse.parse(rows.map(toBillPayment)));
});

router.post("/bill-payments", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can record bill payments" });
    return;
  }

  const parsed = CreateBillPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bill] = await db.select().from(vendorBillsTable).where(eq(vendorBillsTable.id, parsed.data.vendorBillId));
  if (!bill) {
    res.status(404).json({ error: "Unknown vendor bill" });
    return;
  }

  const [created] = await db.insert(billPaymentsTable).values(parsed.data).returning();
  res.status(201).json(CreateBillPaymentResponse.parse(toBillPayment(created)));
});

router.delete("/bill-payments/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete bill payments" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(billPaymentsTable).where(eq(billPaymentsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Bill payment not found" });
    return;
  }

  res.status(204).send();
});

export default router;
