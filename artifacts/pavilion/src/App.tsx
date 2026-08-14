import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';

import { AuthProvider, useAuth } from './context/auth-context';
import { RequireAuth } from './components/require-auth';
import { Layout } from './components/layout';
import Members from './pages/members';
import Events from './pages/events';

import Gallery from './pages/gallery';
import Join from './pages/join';
import Contact from './pages/contact';
import SelectSociety from './pages/select-society';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import Entry from './pages/entry';
import EntryLog from './pages/entry-log';
import Gate from './pages/gate';
import Maintenance from './pages/maintenance';
import Complain from './pages/complain';
import Emergency from './pages/emergency';
import Amenities from './pages/amenities';
import FlatDirectory from './pages/flat-directory';
import MyFlat from './pages/my-flat';
import PayMaintenance from './pages/pay-maintenance';
import Admin from './pages/admin';
import SocietyMaster from './pages/admin/masters/society';
import BuildingMaster from './pages/admin/masters/buildings';
import FlatResident from './pages/admin/masters/flats';
import ExpenseMaster from './pages/admin/masters/expenses';
import VendorMaster from './pages/admin/masters/vendors';
import MaintenanceSettings from './pages/admin/transactions/maintenance-settings';
import MaintenanceDiscounts from './pages/admin/transactions/maintenance-discounts';
import SpecialContributions from './pages/admin/transactions/special-contributions';
import MaintenanceExpenses from './pages/admin/transactions/maintenance-expenses';
import BillPayments from './pages/admin/transactions/bill-payments';
import MaintenanceCollections from './pages/admin/transactions/maintenance-collections';
import AdminDashboard from './pages/admin/dashboard';
import DueList from './pages/admin/due-list';
import MaintenanceDueReport from './pages/admin/reports/maintenance-due';
import MonthlyCollectionDetail from './pages/admin/reports/monthly-collections';
import MonthlyExpenditureReport from './pages/admin/reports/monthly-expenditure';
import IncomeVsExpenseTrend from './pages/admin/reports/income-vs-expense-trend';
import BalanceSheet from './pages/admin/reports/balance-sheet';
import IncomeStatement from './pages/admin/reports/income-statement';
import AdminMembers from './pages/admin/members';
import SocietyRules from './pages/admin/society-rules';
import AdminServices from './pages/admin/services';
import Notices from './pages/admin/notices';
import AdminEvents from './pages/admin/events';
import AdminGallery from './pages/admin/gallery';
import AuditLogs from './pages/admin/audit-logs';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// Pavilion is a resident-only app — there's no public landing page to show, so "/" just
// sends people to wherever is actually useful to them: their dashboard if signed in, or
// the "choose your society" step (which leads into login) if not.
function Root() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <Redirect to={user ? '/dashboard' : '/select-society'} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Root} />
      <Route path="/members" component={Members} />
      <Route path="/events" component={Events} />

      <Route path="/gallery" component={Gallery} />
      <Route path="/join" component={Join} />
      <Route path="/contact" component={Contact} />
      <Route path="/select-society" component={SelectSociety} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      <Route path="/entry">
        <RequireAuth>
          <Entry />
        </RequireAuth>
      </Route>
      <Route path="/gate">
        <RequireAuth roles={["guard", "admin"]}>
          <Gate />
        </RequireAuth>
      </Route>
      <Route path="/entry-log">
        <RequireAuth roles={["guard", "admin"]}>
          <EntryLog />
        </RequireAuth>
      </Route>
      <Route path="/maintenance">
        <RequireAuth>
          <Maintenance />
        </RequireAuth>
      </Route>
      <Route path="/complain">
        <RequireAuth>
          <Complain />
        </RequireAuth>
      </Route>
      <Route path="/emergency">
        <RequireAuth>
          <Emergency />
        </RequireAuth>
      </Route>
      <Route path="/amenities">
        <RequireAuth>
          <Amenities />
        </RequireAuth>
      </Route>
      <Route path="/flat-directory">
        <RequireAuth roles={["guard", "admin"]}>
          <FlatDirectory />
        </RequireAuth>
      </Route>
      <Route path="/my-flat">
        <RequireAuth>
          <MyFlat />
        </RequireAuth>
      </Route>
      <Route path="/pay-maintenance">
        <RequireAuth>
          <PayMaintenance />
        </RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAuth roles={["admin"]}>
          <Admin />
        </RequireAuth>
      </Route>
      <Route path="/admin/masters/society">
        <RequireAuth roles={["admin"]}>
          <SocietyMaster />
        </RequireAuth>
      </Route>
      <Route path="/admin/masters/buildings">
        <RequireAuth roles={["admin"]}>
          <BuildingMaster />
        </RequireAuth>
      </Route>
      <Route path="/admin/masters/flats">
        <RequireAuth roles={["admin"]}>
          <FlatResident />
        </RequireAuth>
      </Route>
      <Route path="/admin/masters/expenses">
        <RequireAuth roles={["admin"]}>
          <ExpenseMaster />
        </RequireAuth>
      </Route>
      <Route path="/admin/masters/vendors">
        <RequireAuth roles={["admin"]}>
          <VendorMaster />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/maintenance-settings">
        <RequireAuth roles={["admin"]}>
          <MaintenanceSettings />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/maintenance-discounts">
        <RequireAuth roles={["admin"]}>
          <MaintenanceDiscounts />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/special-contributions">
        <RequireAuth roles={["admin"]}>
          <SpecialContributions />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/maintenance-expenses">
        <RequireAuth roles={["admin"]}>
          <MaintenanceExpenses />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/bill-payments">
        <RequireAuth roles={["admin"]}>
          <BillPayments />
        </RequireAuth>
      </Route>
      <Route path="/admin/transactions/maintenance-collections">
        <RequireAuth roles={["admin"]}>
          <MaintenanceCollections />
        </RequireAuth>
      </Route>
      <Route path="/admin/dashboard">
        <RequireAuth roles={["admin"]}>
          <AdminDashboard />
        </RequireAuth>
      </Route>
      <Route path="/admin/due-list">
        <RequireAuth roles={["admin"]}>
          <DueList />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/maintenance-due">
        <RequireAuth roles={["admin"]}>
          <MaintenanceDueReport />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/monthly-collections">
        <RequireAuth roles={["admin"]}>
          <MonthlyCollectionDetail />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/monthly-expenditure">
        <RequireAuth roles={["admin"]}>
          <MonthlyExpenditureReport />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/income-vs-expense-trend">
        <RequireAuth roles={["admin"]}>
          <IncomeVsExpenseTrend />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/balance-sheet">
        <RequireAuth roles={["admin"]}>
          <BalanceSheet />
        </RequireAuth>
      </Route>
      <Route path="/admin/reports/income-statement">
        <RequireAuth roles={["admin"]}>
          <IncomeStatement />
        </RequireAuth>
      </Route>
      <Route path="/admin/members">
        <RequireAuth roles={["admin"]}>
          <AdminMembers />
        </RequireAuth>
      </Route>
      <Route path="/admin/society-rules">
        <RequireAuth roles={["admin"]}>
          <SocietyRules />
        </RequireAuth>
      </Route>
      <Route path="/admin/services">
        <RequireAuth roles={["admin"]}>
          <AdminServices />
        </RequireAuth>
      </Route>
      <Route path="/admin/notices">
        <RequireAuth roles={["admin"]}>
          <Notices />
        </RequireAuth>
      </Route>
      <Route path="/admin/events">
        <RequireAuth roles={["admin"]}>
          <AdminEvents />
        </RequireAuth>
      </Route>
      <Route path="/admin/gallery">
        <RequireAuth roles={["admin"]}>
          <AdminGallery />
        </RequireAuth>
      </Route>
      <Route path="/admin/audit-logs">
        <RequireAuth roles={["admin"]}>
          <AuditLogs />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
