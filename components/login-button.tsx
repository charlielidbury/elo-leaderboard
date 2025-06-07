"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { UserDropdown } from "./user-dropdown";
import { LogIn, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await signInWithEmail(email, password);
    if (success) {
      onOpenChange(false);
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await signUp(email, password);
    if (success) {
      onOpenChange(false);
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen m-0 rounded-none flex flex-col bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="text-center pt-12 pb-8">
          <DialogTitle className="text-4xl font-bold mb-2">
            Welcome to ELO Leaderboard
          </DialogTitle>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Sign in to track your competitive rankings and challenge other
            players
          </p>
        </DialogHeader>

        <div className="flex-1 flex items-start justify-center pt-8 pb-16">
          <div className="w-full max-w-sm space-y-8">
            {/* Google Sign In */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50"
                size="lg"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Tabs */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
                <TabsTrigger value="signin" className="font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-medium">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6 mt-6">
                <form onSubmit={handleEmailSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base border-2 focus:border-primary"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="current-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 text-base border-2 focus:border-primary"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium mt-6"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 mt-6">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base border-2 focus:border-primary"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="new-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 text-base border-2 focus:border-primary"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium mt-6"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LoginButton() {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
    return <UserDropdown />;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        Login
      </Button>
      <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
