import { Router, type IRouter } from "express";
import { eq, like, sql } from "drizzle-orm";
import { db, vendorBillsTable, vendorsTable, expenseCategoriesTable, billPaymentsTable, type VendorBill } from "@workspace/db";
import { ListVendorBillsResponse, CreateVendorBillBody, CreateVendorBillResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function statusFor(amountPaise: number, paidAmountPaise: number): "unpaid" | "partially_paid" | "paid" {
  if (paidAmountPaise <= 0) return "unpaid";
  if (paidAmountPaise >= amountPaise) return "paid";
  return "partially_paid";
}

function toVendorBill(
  row: VendorBill,
  vendorName: string,
  expenseCategoryName: string,
  paidAmountPaise: number,
) {
  return {
    id: row.id,
    vendorId: row.vendorId,
    vendorName,
    expenseCategoryId: row.expenseCategoryId,
    expenseCategoryName,
    billNumber: row.billNumber,
    billDate: row.billDate,
    amountPaise: row.amountPaise,
    description: row.description,
    paidAmountPaise,
    status: statusFor(row.amountPaise, paidAmountPaise),
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/vendor-bills", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view vendor bills" });
    return;
  }

  const month = typeof req.query.month === "string" ? req.query.month : undefined;

  const rows = await db
    .select({
      bill: vendorBillsTable,
      vendorName: vendorsTable.name,
      expenseCategoryName: expenseCategoriesTable.name,
      paidAmountPaise: sql<number>`coalesce(sum(${billPaymentsTable.amountPaise}), 0)`,
    })
    .from(vendorBillsTable)
    .innerJoin(vendorsTable, eq(vendorBillsTable.vendorId, vendorsTable.id))
    .innerJoin(expenseCategoriesTable, eq(vendorBillsTable.expenseCategoryId, expenseCategoriesTable.id))
    .leftJoin(billPaymentsTable, eq(billPaymentsTable.vendorBillId, vendorBillsTable.id))
    .where(month !== undefined ? like(vendorBillsTable.billDate, `${month}%`) : undefined)
    .groupBy(vendorBillsTable.id);

  res.status(200).json(
    ListVendorBillsResponse.parse(
      rows.map(({ bill, vendorName, expenseCategoryName, paidAmountPaise }) =>
        toVendorBill(bill, vendorName, expenseCategoryName, paidAmountPaise),
      ),
    ),
  );
});

router.post("/vendor-bills", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add vendor bills" });
    return;
  }

  const parsed = CreateVendorBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, parsed.data.vendorId));
  const [expenseCategory] = await db
    .select()
    .from(expenseCategoriesTable)
    .where(eq(expenseCategoriesTable.id, parsed.data.expenseCategoryId));
  if (!vendor || !expenseCategory) {
    res.status(404).json({ error: "Unknown vendor or expense category" });
    return;
  }

  const [created] = await db.insert(vendorBillsTable).values(parsed.data).returning();
  res.status(201).json(CreateVendorBillResponse.parse(toVendorBill(created, vendor.name, expenseCategory.name, 0)));
});

router.delete("/vendor-bills/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete vendor bills" });
    return;
  }

  const id = Number(req.params.id);

  const [paymentAgainstBill] = await db
    .select()
    .from(billPaymentsTable)
    .where(eq(billPaymentsTable.vendorBillId, id))
    .limit(1);
  if (paymentAgainstBill) {
    res.status(409).json({ error: "Payments have already been recorded against this bill" });
    return;
  }

  const [deleted] = await db.delete(vendorBillsTable).where(eq(vendorBillsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Vendor bill not found" });
    return;
  }

  res.status(204).send();
});

export default router;
