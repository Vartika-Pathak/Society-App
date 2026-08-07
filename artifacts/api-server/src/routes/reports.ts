import { Router, type IRouter } from "express";
import { and, eq, gte, like, lte, sql } from "drizzle-orm";
import {
  db,
  flatsTable,
  buildingsTable,
  maintenanceRatesTable,
  maintenanceCollectionsTable,
  vendorBillsTable,
  billPaymentsTable,
  flatTypes,
  type FlatType,
} from "@workspace/db";
import {
  GetDueListResponse,
  GetDashboardSummaryResponse,
  GetBalanceSheetResponse,
  GetIncomeStatementResponse,
  GetIncomeVsExpenseTrendResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Trailing N months ending at the current month, oldest first — e.g. months=3 in
// August gives ["2026-06", "2026-07", "2026-08"].
function trailingMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

async function monthlyIncome(month: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${maintenanceCollectionsTable.amountPaise}), 0)` })
    .from(maintenanceCollectionsTable)
    .where(eq(maintenanceCollectionsTable.forMonth, month));
  return row?.total ?? 0;
}

async function monthlyExpense(month: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${billPaymentsTable.amountPaise}), 0)` })
    .from(billPaymentsTable)
    .where(like(billPaymentsTable.paymentDate, `${month}%`));
  return row?.total ?? 0;
}

async function allTimeIncome(): Promise<number> {
  const [row] = await db.select({ total: sql<number>`coalesce(sum(${maintenanceCollectionsTable.amountPaise}), 0)` }).from(
    maintenanceCollectionsTable,
  );
  return row?.total ?? 0;
}

async function allTimeExpense(): Promise<number> {
  const [row] = await db.select({ total: sql<number>`coalesce(sum(${billPaymentsTable.amountPaise}), 0)` }).from(billPaymentsTable);
  return row?.total ?? 0;
}

async function totalPayables(): Promise<number> {
  const rows = await db
    .select({
      amountPaise: vendorBillsTable.amountPaise,
      paidAmountPaise: sql<number>`coalesce(sum(${billPaymentsTable.amountPaise}), 0)`,
    })
    .from(vendorBillsTable)
    .leftJoin(billPaymentsTable, eq(billPaymentsTable.vendorBillId, vendorBillsTable.id))
    .groupBy(vendorBillsTable.id);

  return rows.reduce((sum, row) => sum + Math.max(row.amountPaise - row.paidAmountPaise, 0), 0);
}

async function dueListForMonth(month: string) {
  const [flats, rates, collections] = await Promise.all([
    db
      .select({ flat: flatsTable, buildingName: buildingsTable.name })
      .from(flatsTable)
      .innerJoin(buildingsTable, eq(flatsTable.buildingId, buildingsTable.id)),
    db.select().from(maintenanceRatesTable),
    db
      .select({
        flatId: maintenanceCollectionsTable.flatId,
        total: sql<number>`coalesce(sum(${maintenanceCollectionsTable.amountPaise}), 0)`,
      })
      .from(maintenanceCollectionsTable)
      .where(eq(maintenanceCollectionsTable.forMonth, month))
      .groupBy(maintenanceCollectionsTable.flatId),
  ]);

  const rateByFlatType = new Map(rates.map((r) => [r.flatType, r.monthlyAmountPaise]));
  const collectedByFlatId = new Map(collections.map((c) => [c.flatId, c.total]));

  return flats.map(({ flat, buildingName }) => {
    const expectedAmountPaise = rateByFlatType.get(flat.flatType) ?? 0;
    const collectedAmountPaise = collectedByFlatId.get(flat.id) ?? 0;
    return {
      flatId: flat.id,
      buildingName,
      flatNumber: flat.flatNumber,
      flatType: flat.flatType,
      expectedAmountPaise,
      collectedAmountPaise,
      dueAmountPaise: Math.max(expectedAmountPaise - collectedAmountPaise, 0),
    };
  });
}

router.get("/reports/due-list", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view the due list" });
    return;
  }

  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  if (!month) {
    res.status(400).json({ error: "month is required (YYYY-MM)" });
    return;
  }

  res.status(200).json(GetDueListResponse.parse(await dueListForMonth(month)));
});

router.get("/reports/dashboard-summary", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view the dashboard summary" });
    return;
  }

  const month = currentMonth();
  const months = trailingMonths(6);

  const [income, expense, cashIn, cashOut, dueList, rates, flatsByType] = await Promise.all([
    monthlyIncome(month),
    monthlyExpense(month),
    allTimeIncome(),
    allTimeExpense(),
    dueListForMonth(month),
    db.select().from(maintenanceRatesTable),
    db
      .select({ flatType: flatsTable.flatType, count: sql<number>`count(*)` })
      .from(flatsTable)
      .groupBy(flatsTable.flatType),
  ]);

  const rateByFlatType = new Map(rates.map((r) => [r.flatType, r.monthlyAmountPaise]));
  const countByFlatType = new Map(flatsByType.map((f) => [f.flatType, f.count]));
  const collectedByFlatType = new Map<FlatType, number>();
  for (const entry of dueList) {
    collectedByFlatType.set(entry.flatType, (collectedByFlatType.get(entry.flatType) ?? 0) + entry.collectedAmountPaise);
  }

  const maintenanceSummary = flatTypes.map((flatType) => {
    const totalFlats = countByFlatType.get(flatType) ?? 0;
    const monthlyAmountPaise = rateByFlatType.get(flatType) ?? 0;
    return {
      flatType,
      totalFlats,
      monthlyAmountPaise,
      expectedTotalPaise: totalFlats * monthlyAmountPaise,
      collectedTotalPaise: collectedByFlatType.get(flatType) ?? 0,
    };
  });

  const monthlyTrend = await Promise.all(
    months.map(async (m) => ({
      month: m,
      incomePaise: await monthlyIncome(m),
      expensePaise: await monthlyExpense(m),
    })),
  );

  res.status(200).json(
    GetDashboardSummaryResponse.parse({
      cashBalancePaise: cashIn - cashOut,
      totalCollectedThisMonthPaise: income,
      totalExpensesThisMonthPaise: expense,
      totalDueThisMonthPaise: dueList.reduce((sum, entry) => sum + entry.dueAmountPaise, 0),
      maintenanceSummary,
      monthlyTrend,
    }),
  );
});

router.get("/reports/balance-sheet", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view the balance sheet" });
    return;
  }

  const [totalCollectedPaise, totalPaidToVendorsPaise, totalPayablesPaise] = await Promise.all([
    allTimeIncome(),
    allTimeExpense(),
    totalPayables(),
  ]);

  res.status(200).json(
    GetBalanceSheetResponse.parse({
      totalCollectedPaise,
      totalPaidToVendorsPaise,
      cashBalancePaise: totalCollectedPaise - totalPaidToVendorsPaise,
      totalPayablesPaise,
    }),
  );
});

router.get("/reports/income-statement", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view the income statement" });
    return;
  }

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  if (!from || !to) {
    res.status(400).json({ error: "from and to are required (YYYY-MM-DD)" });
    return;
  }

  const [incomeRow] = await db
    .select({ total: sql<number>`coalesce(sum(${maintenanceCollectionsTable.amountPaise}), 0)` })
    .from(maintenanceCollectionsTable)
    .where(and(gte(maintenanceCollectionsTable.paymentDate, from), lte(maintenanceCollectionsTable.paymentDate, to)));
  const [expenseRow] = await db
    .select({ total: sql<number>`coalesce(sum(${billPaymentsTable.amountPaise}), 0)` })
    .from(billPaymentsTable)
    .where(and(gte(billPaymentsTable.paymentDate, from), lte(billPaymentsTable.paymentDate, to)));

  const incomePaise = incomeRow?.total ?? 0;
  const expensePaise = expenseRow?.total ?? 0;

  res.status(200).json(
    GetIncomeStatementResponse.parse({ from, to, incomePaise, expensePaise, netPaise: incomePaise - expensePaise }),
  );
});

router.get("/reports/income-vs-expense-trend", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view this report" });
    return;
  }

  const months = trailingMonths(req.query.months ? Number(req.query.months) : 6);
  const trend = await Promise.all(
    months.map(async (m) => ({
      month: m,
      incomePaise: await monthlyIncome(m),
      expensePaise: await monthlyExpense(m),
    })),
  );

  res.status(200).json(GetIncomeVsExpenseTrendResponse.parse(trend));
});

export default router;
