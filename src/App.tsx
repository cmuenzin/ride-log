import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Garage from "./pages/Garage";
import AddVehicle from "./pages/AddVehicle";
import AddMaintenancePage from "./pages/AddMaintenancePage";
import HistoryPage from "./pages/HistoryPage";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGuard>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/garage" element={<Garage />} />
              <Route path="/garage/add" element={<AddVehicle />} />
              <Route path="/maintenance/add" element={<AddMaintenancePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthGuard>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
