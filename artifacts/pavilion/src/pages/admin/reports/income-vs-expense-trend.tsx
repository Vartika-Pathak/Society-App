import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useGetIncomeVsExpenseTrend, getGetIncomeVsExpenseTrendQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function IncomeVsExpenseTrend() {
  const trend = useGetIncomeVsExpenseTrend(
    { months: 6 },
    { query: { queryKey: getGetIncomeVsExpenseTrendQueryKey({ months: 6 }) } },
  );

  const chartData = (trend.data ?? []).map((point) => ({
    month: point.month,
    Income: point.incomePaise / 100,
    Expense: point.expensePaise / 100,
  }));

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Income vs Expense Trend</h1>
          <p className="text-muted-foreground text-sm">Maintenance collected vs vendor payments made, over the last 6 months.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trend (₹)</CardTitle>
            <CardDescription>Income = maintenance collections. Expense = vendor bill payments.</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : trend.isError ? (
              <p className="text-destructive text-sm">Couldn't load the trend — try refreshing the page.</p>
            ) : chartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
