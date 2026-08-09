import React, { useState } from "react";
import { useListFlatDirectory, getListFlatDirectoryQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search } from "lucide-react";

// Read-only for guards — verifying who lives where when a visitor or delivery shows up at the
// gate. No edit rights: reassigning a resident to a flat stays admin-only (Flat Resident).
export default function FlatDirectory() {
  const [search, setSearch] = useState("");
  const directory = useListFlatDirectory({ query: { queryKey: getListFlatDirectoryQueryKey() } });

  const filtered = directory.data?.filter((entry) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.flatNumber.toLowerCase().includes(q) ||
      entry.buildingName.toLowerCase().includes(q) ||
      entry.residentName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium mb-1">Flat Directory</h1>
        <p className="text-muted-foreground text-sm">
          Look up which resident lives in a flat, to verify visitors and deliveries at the gate.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by flat, building, or resident…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Flats</CardTitle>
          <CardDescription>
            {filtered?.length ?? 0} flat{filtered?.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directory.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : filtered && filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Building</TableHead>
                  <TableHead>Flat Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.flatId}>
                    <TableCell>{entry.buildingName}</TableCell>
                    <TableCell className="font-medium">{entry.flatNumber}</TableCell>
                    <TableCell>
                      <Badge variant={entry.occupied ? "default" : "secondary"}>
                        {entry.occupied ? "Occupied" : "Vacant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.residentName ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.residentEmail ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">No matching flats.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
