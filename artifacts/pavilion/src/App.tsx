import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AuthProvider } from './context/auth-context';
import { RequireAuth } from './components/require-auth';
import { Layout } from './components/layout';
import Home from './pages/home';
import About from './pages/about';
import Members from './pages/members';
import Events from './pages/events';

import Gallery from './pages/gallery';
import Join from './pages/join';
import Contact from './pages/contact';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import Entry from './pages/entry';
import Gate from './pages/gate';
import Maintenance from './pages/maintenance';
import Complain from './pages/complain';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/members" component={Members} />
      <Route path="/events" component={Events} />

      <Route path="/gallery" component={Gallery} />
      <Route path="/join" component={Join} />
      <Route path="/contact" component={Contact} />
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
