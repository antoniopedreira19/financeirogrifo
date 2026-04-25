import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  LogOut,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoSemFundo from "@/assets/logo-sem-fundo.png";

export function Sidebar() {
  const { user, selectedObra, logout, clearSelectedObra } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOrcamento = user?.role === "orcamento";
  const isDirector = user?.role === "diretor" || user?.role === "diretor_obra";
  const isEngenheiro = user?.role === "engenheiro" || user?.role === "engenheiro_assistente";

  const adminNavItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/titulos", label: "Títulos", icon: FileText },
    { path: "/admin/aprovacoes", label: "Aprovações", icon: CheckSquare },
    { path: "/admin/usuarios", label: "Usuários", icon: Users },
    { path: "/admin/obras", label: "Obras", icon: Building2 },
  ];

  const orcamentoNavItems = [
    { path: "/obra/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/obra/titulos", label: "Meus Títulos", icon: FileText },
    { path: "/orcamento/obras", label: "Obras", icon: Building2 },
  ];

  // Roles that can approve/pay get the Aprovações tab
  const canApprove = ['engenheiro_assistente', 'engenheiro', 'diretor_obra', 'diretor'].includes(user?.role || '');
  const canSeeDashboard = ['admin', 'diretor', 'diretor_obra'].includes(user?.role || '');

  const obraNavItems = [
    ...(canSeeDashboard ? [{ path: "/obra/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    { path: "/obra/titulos", label: "Meus Títulos", icon: FileText },
    ...(canApprove ? [{ path: "/obra/aprovacoes", label: "Aprovações", icon: CheckSquare }] : []),
  ];

  const navItems = isAdmin ? adminNavItems : isOrcamento ? orcamentoNavItems : obraNavItems;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  const SidebarNavItem = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = location.pathname === item.path;

    const link = (
      <NavLink
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
          isActive && "bg-sidebar-accent text-sidebar-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent")} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        sidebarWidth
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn("relative flex items-center border-b border-sidebar-border", collapsed ? "justify-center py-6 px-2" : "justify-center py-6 px-6")}>
        <img
          src={logoSemFundo}
          alt="Grifo Logo"
          className={cn("object-contain transition-all duration-300", collapsed ? "h-10" : "h-14")}
          loading="eager"
          fetchPriority="high"
        />

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 z-10",
            "h-6 w-6 rounded-full bg-accent text-accent-foreground",
            "flex items-center justify-center shadow-md",
            "hover:bg-accent/90 transition-colors",
            "hidden lg:flex"
          )}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Selected Obra (non-admin, non-collapsed) */}
      {!isAdmin && selectedObra && !collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent/50">
            <Building2 className="h-4 w-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Obra Ativa</p>
              <p className="text-sm font-medium truncate">{selectedObra.nome}</p>
            </div>
            <button
              onClick={clearSelectedObra}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Obra (collapsed) */}
      {!isAdmin && selectedObra && collapsed && (
        <div className="px-2 py-3 border-b border-sidebar-border flex justify-center">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={clearSelectedObra}
                className="p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
              >
                <Building2 className="h-4 w-4 text-accent" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              {selectedObra.nome} — Trocar obra
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => (
          <SidebarNavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User info & logout */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
        {!collapsed && (
          <div className="mb-3 px-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full p-2.5 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 z-10 p-1 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-full w-64">{/* Force expanded on mobile */}
              <aside className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-64">
                {/* Reuse same structure but always expanded */}
                <div className="flex items-center justify-center py-5 px-6 border-b border-sidebar-border">
                  <img src={logoSemFundo} alt="Grifo Logo" className="h-10 object-contain" loading="eager" fetchPriority="high" />
                </div>

                {!isAdmin && selectedObra && (
                  <div className="px-4 py-3 border-b border-sidebar-border">
                    <button
                      type="button"
                      onClick={() => {
                        clearSelectedObra();
                        setMobileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left"
                    >
                      <Building2 className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Obra Ativa</p>
                        <p className="text-sm font-medium truncate">{selectedObra.nome}</p>
                      </div>
                    </button>
                  </div>
                )}

                <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                          isActive && "bg-sidebar-accent text-sidebar-foreground"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent")} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-sidebar-border">
                  <div className="mb-3 px-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.nome}</p>
                    <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:block shrink-0 transition-all duration-300", sidebarWidth)}>
        {sidebarContent}
      </div>
    </>
  );
}
