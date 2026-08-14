import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ChevronDown,
  Building2,
  Receipt,
  ListChecks,
  BarChart3,
  ShieldCheck,
  Users,
  BookText,
  Wrench,
  History,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const topLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/due-list", label: "Due List", icon: ListChecks },
  { href: "/admin/society-rules", label: "Society Rules", icon: BookText },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
];

const mastersLinks = [
  { href: "/admin/masters/society", label: "Society Master" },
  { href: "/admin/masters/buildings", label: "Building Master" },
  { href: "/admin/masters/flats", label: "Flat Resident" },
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

const reportsLinks = [
  { href: "/admin/reports/maintenance-due", label: "Maintenance Due Report" },
  { href: "/admin/reports/monthly-collections", label: "Monthly Collection Detail" },
  { href: "/admin/reports/monthly-expenditure", label: "Monthly Expenditure Report" },
  { href: "/admin/reports/income-vs-expense-trend", label: "Income vs Expense Trend" },
  { href: "/admin/reports/balance-sheet", label: "Balance Sheet" },
  { href: "/admin/reports/income-statement", label: "Income Statement" },
];

const noticesAndEventsLinks = [
  { href: "/admin/notices", label: "Society Notices" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/gallery", label: "Gallery" },
];

interface NavSection {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  links: { href: string; label: string }[];
}

const sections: NavSection[] = [
  { icon: Building2, label: "Masters", links: mastersLinks },
  { icon: Receipt, label: "Transactions", links: transactionsLinks },
  { icon: BarChart3, label: "Reports", links: reportsLinks },
  { icon: BookText, label: "Notices, Events & Gallery", links: noticesAndEventsLinks },
];

// A dedicated left-nav shell for the /admin/* area, separate from the site's public top nav.
export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="w-full flex flex-1">
      <aside className="w-64 shrink-0 border-r bg-card/50 py-6 hidden md:block">
        <nav className="space-y-1 px-3">
          {topLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {sections.map((section) => {
            const isActiveSection = section.links.some((link) => location === link.href);
            const Icon = section.icon;
            return (
              <div key={section.label}>
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
