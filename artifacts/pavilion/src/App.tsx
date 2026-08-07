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
import Gate from './pages/gate';
import Maintenance from './pages/maintenance';
import Complain from './pages/complain';
import Emergency from './pages/emergency';
import Amenities from './pages/amenities';
import Admin from './pages/admin';
import SocietyMaster from './pages/admin/masters/society';
import BuildingMaster from './pages/admin/masters/buildings';
import FlatMaster from './pages/admin/masters/flats';
import ExpenseMaster from './pages/admin/masters/expenses';
import VendorMaster from './pages/admin/masters/vendors';
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
          <FlatMaster />
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
