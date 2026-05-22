import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground hidden sm:block">
            The world's voice, unfiltered.
          </span>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  title="Admin Dashboard"
                  aria-label="Open admin dashboard"
                  className="gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Admin</span>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Sign Out?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      You will need to verify your phone number again to sign back in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border text-foreground hover:bg-muted hover:text-foreground">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={signOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sign Out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
