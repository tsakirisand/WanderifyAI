"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plane, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme");
    const isDark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowSignOutConfirm(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Wanderify</span>
          </Link>
          <nav className="flex items-center gap-4">
            {mounted ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
            ) : (
              <div className="w-9 h-9" />
            )}

            {!loading && user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSignOutConfirm(true)} 
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </Button>
              </>
            ) : !loading && !user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm font-medium">Log in</Button>
                </Link>
                <Link href="/login">
                  <Button className="text-sm font-medium">Get Started</Button>
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
              <LogOut className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Sign Out</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to sign out of your Wanderify account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowSignOutConfirm(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSignOut}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
