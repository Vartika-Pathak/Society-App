import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Layout } from './components/layout';
import Home from './pages/home';
import About from './pages/about';
import Members from './pages/members';
import Events from './pages/events';
import News from './pages/news';
import NewsPost from './pages/news-post';
import Gallery from './pages/gallery';
import Join from './pages/join';
import Contact from './pages/contact';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/members" component={Members} />
      <Route path="/events" component={Events} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsPost} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/join" component={Join} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
