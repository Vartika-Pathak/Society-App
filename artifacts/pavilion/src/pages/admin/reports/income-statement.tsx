import React, { useState } from "react";
import { useGetIncomeStatement, getGetIncomeStatementQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function firstOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function IncomeStatement() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const params = { from, to };
  const statement = useGetIncomeStatement(params, { query: { queryKey: getGetIncomeStatementQueryKey(params) } });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Income Statement</h1>
          <p className="text-muted-foreground text-sm">Income vs expenses for a date range.</p>
        </div>

        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="income-from">From</Label>
            <Input id="income-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="income-to">To</Label>
            <Input id="income-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {statement.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : statement.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-2xl">₹{(statement.data.incomePaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Expenses</CardDescription>
                <CardTitle className="text-2xl">₹{(statement.data.expensePaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{statement.data.netPaise >= 0 ? "Surplus" : "Deficit"}</CardDescription>
                <CardTitle className="text-2xl">₹{(Math.abs(statement.data.netPaise) / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Couldn't load the income statement.</p>
        )}
      </div>
    </AdminLayout>
  );
}
