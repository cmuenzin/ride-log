import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Warehouse, History, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/",
      active: isActive("/") && location.pathname === "/"
    },
    {
      icon: Warehouse,
      label: "Garage",
      path: "/garage",
      active: isActive("/garage")
    },
    {
      icon: History,
      label: "Historie",
      path: "/history",
      active: isActive("/history")
    },
    {
      icon: Calendar,
      label: "Kalender",
      path: "/calendar",
      active: isActive("/calendar")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <h1 
              className="text-2xl font-bold text-primary cursor-pointer"
              onClick={() => navigate('/')}
            >
              Ride-Log
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`gap-2 ${
                    item.active 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-surface-secondary text-foreground-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Empty space where button was */}
          <div></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-sm border-t border-border">
        <nav className="flex items-center justify-around px-4 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex-col gap-1 h-12 px-2 ${
                  item.active 
                    ? "text-primary" 
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Mobile padding to prevent content overlap */}
      <div className="md:hidden h-16" />
    </div>
  );
};

export default Layout;