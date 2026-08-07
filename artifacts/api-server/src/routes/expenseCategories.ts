import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, expenseCategoriesTable, type ExpenseCategory } from "@workspace/db";
import {
  ListExpenseCategoriesResponse,
  CreateExpenseCategoryBody,
  CreateExpenseCategoryResponse,
  UpdateExpenseCategoryBody,
  UpdateExpenseCategoryResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toExpenseCategory(row: ExpenseCategory) {
  return { id: row.id, name: row.name, gstSlabPercent: row.gstSlabPercent };
}

router.get("/expense-categories", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view expense categories" });
    return;
  }

  const rows = await db.select().from(expenseCategoriesTable);
  res.status(200).json(ListExpenseCategoriesResponse.parse(rows.map(toExpenseCategory)));
});

router.post("/expense-categories", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add expense categories" });
    return;
  }

  const parsed = CreateExpenseCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(expenseCategoriesTable).values(parsed.data).returning();
  res.status(201).json(CreateExpenseCategoryResponse.parse(toExpenseCategory(created)));
});

router.put("/expense-categories/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update expense categories" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateExpenseCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(expenseCategoriesTable)
    .set(parsed.data)
    .where(eq(expenseCategoriesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Expense category not found" });
    return;
  }

  res.status(200).json(UpdateExpenseCategoryResponse.parse(toExpenseCategory(updated)));
});

router.delete("/expense-categories/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete expense categories" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(expenseCategoriesTable)
    .where(eq(expenseCategoriesTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Expense category not found" });
    return;
  }

  res.status(204).send();
});

export default router;
