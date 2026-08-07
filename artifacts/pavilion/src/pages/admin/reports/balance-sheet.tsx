import React from "react";
import { useGetBalanceSheet, getGetBalanceSheetQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BalanceSheet() {
  const balanceSheet = useGetBalanceSheet({ query: { queryKey: getGetBalanceSheetQueryKey() } });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Society Financial Balance Sheet</h1>
          <p className="text-muted-foreground text-sm">An all-time snapshot of cash collected, paid out, and still owed.</p>
        </div>

        {balanceSheet.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : balanceSheet.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Collected (all time)</CardDescription>
                <CardTitle className="text-2xl">₹{(balanceSheet.data.totalCollectedPaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Paid to Vendors (all time)</CardDescription>
                <CardTitle className="text-2xl">₹{(balanceSheet.data.totalPaidToVendorsPaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cash Balance</CardDescription>
                <CardTitle className="text-2xl">₹{(balanceSheet.data.cashBalancePaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Outstanding Payables to Vendors</CardDescription>
                <CardTitle className="text-2xl">₹{(balanceSheet.data.totalPayablesPaise / 100).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Couldn't load the balance sheet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
