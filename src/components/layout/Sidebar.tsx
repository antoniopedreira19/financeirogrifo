import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Building2, LogOut, ChevronLeft, Menu, CheckSquare, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Sidebar() {
  const { user, selectedObra, logout, clearSelectedObra } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const isAdmin = user?.role === "admin";
  const isOrcamento = user?.role === "orcamento";

  const adminNavItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/titulos", label: "Títulos", icon: FileText },
    { path: "/admin/aprovacoes", label: "Aprovações", icon: CheckSquare },
    { path: "/admin/usuarios", label: "Usuários", icon: Users },
    { path: "/admin/obras", label: "Obras", icon: Building2 },
  ];

  const orcamentoNavItems = [
    { path: "/orcamento/obras", label: "Obras", icon: Building2 },
  ];

  const obraNavItems = [
    { path: "/obra/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/obra/titulos", label: "Meus Títulos", icon: FileText },
  ];

  const navItems = isAdmin ? adminNavItems : isOrcamento ? orcamentoNavItems : obraNavItems;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div className="lg:hidden fixed inset-0 bg-foreground/50 z-40" onClick={() => setCollapsed(true)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Logo variant="dark" size="md" />
        </div>

        {/* Selected Obra (for obra users) */}
        {!isAdmin && !isOrcamento && selectedObra && (
          <div className="px-4 py-3 bg-sidebar-accent/50 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">Obra</p>
                <p className="text-sm font-medium truncate">{selectedObra.nome}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelectedObra}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setCollapsed(true)}
              className={({ isActive }) => cn("nav-item", isActive && "active")}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
