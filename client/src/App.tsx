import { Switch, Route, useSearch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import Multiplayer from "@/pages/Multiplayer";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import EmailConfirmation from "@/pages/EmailConfirmation";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { GameMode } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Cadastro} />
      <Route path="/email-confirmation" component={EmailConfirmation} />
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/multiplayer">
        <ProtectedRoute>
          <Multiplayer />
        </ProtectedRoute>
      </Route>
      <Route path="/game/:worldId">
        {(params) => {
          const searchParams = new URLSearchParams(window.location.search);
          const mode = (searchParams.get('mode') || 'normal') as GameMode;
          return (
            <ProtectedRoute>
              <Game worldId={parseInt(params.worldId)} mode={mode} />
            </ProtectedRoute>
          );
        }}
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
