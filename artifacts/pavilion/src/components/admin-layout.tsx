import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ChevronDown, Building2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const mastersLinks = [
  { href: "/admin/masters/society", label: "Society Master" },
  { href: "/admin/masters/buildings", label: "Building Master" },
  { href: "/admin/masters/flats", label: "Flat Master" },
  { href: "/admin/masters/expenses", label: "Expense Master" },
  { href: "/admin/masters/vendors", label: "Vendor Master" },
];

// A dedicated left-nav shell for the /admin/* area, separate from the site's public top nav —
// this section will keep growing (Transactions, Reports, etc. in later phases), so it gets its
// own chrome rather than trying to cram everything into the public nav bar.
export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const isMastersSection = location.startsWith("/admin/masters");

  return (
    <div className="w-full flex flex-1">
      <aside className="w-64 shrink-0 border-r bg-card/50 py-6 hidden md:block">
        <nav className="space-y-1 px-3">
          <Link
            href="/admin"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location === "/admin" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>

          <div>
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Masters
              <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${isMastersSection ? "rotate-180" : ""}`} />
            </div>
            <div className="ml-6 space-y-1 border-l pl-3">
              {mastersLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    location === link.href ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
