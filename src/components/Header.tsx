import { LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-option-5.png";

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src={logo} alt="One World logo" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            One World
          </span>
        </button>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            The world's voice, unfiltered.
          </span>
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.user_metadata?.phone || user.phone || "User"}
                </span>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  title="Admin Dashboard"
                  className="gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
