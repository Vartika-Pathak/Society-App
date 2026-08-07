import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ChevronDown, Building2, Receipt } from "lucide-react";

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

const transactionsLinks = [
  { href: "/admin/transactions/maintenance-settings", label: "Maintenance Settings" },
  { href: "/admin/transactions/maintenance-discounts", label: "Maintenance Discount" },
  { href: "/admin/transactions/special-contributions", label: "Special Contributions" },
  { href: "/admin/transactions/maintenance-expenses", label: "Maintenance Expenses" },
  { href: "/admin/transactions/bill-payments", label: "Bill Payments" },
  { href: "/admin/transactions/maintenance-collections", label: "Maintenance Collections" },
];

interface NavSection {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prefix: string;
  links: { href: string; label: string }[];
}

const sections: NavSection[] = [
  { icon: Building2, label: "Masters", prefix: "/admin/masters", links: mastersLinks },
  { icon: Receipt, label: "Transactions", prefix: "/admin/transactions", links: transactionsLinks },
];

// A dedicated left-nav shell for the /admin/* area, separate from the site's public top nav —
// this section will keep growing (Reports, etc. in later phases), so it gets its own chrome
// rather than trying to cram everything into the public nav bar.
export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

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

          {sections.map((section) => {
            const isActiveSection = location.startsWith(section.prefix);
            const Icon = section.icon;
            return (
              <div key={section.prefix}>
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {section.label}
                  <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${isActiveSection ? "rotate-180" : ""}`} />
                </div>
                <div className="ml-6 space-y-1 border-l pl-3">
                  {section.links.map((link) => (
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
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
