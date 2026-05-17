import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  // In demo mode, show the landing page by default
  return <Landing />;
}

function AppPage() {
  // In demo mode, always show the main app
  return <Index />;
}

function ClerkProviderWithRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/app" component={AppPage} />
          <Route path="/sign-in/*?" component={() => <Redirect to="/app" />} />
          <Route path="/sign-up/*?" component={() => <Redirect to="/app" />} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const App = () => (
  <WouterRouter base={basePath}>
    <ClerkProviderWithRoutes />
  </WouterRouter>
);

export default App;
