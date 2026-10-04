"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Moon, Sun, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();

  // Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState("signin");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // 1. Theme sync from localStorage, matching home page
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Check if Firebase config is configured
    setIsConfigured(isFirebaseConfigured());
  }, []);

  const toggleTheme = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);

    if (nextState) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getFirebaseErrorMessage = (error) => {
    const code = error?.code || "";
    switch (code) {
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/user-not-found":
        return "No user found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account already exists with this email address.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/missing-password":
        return "Please enter your password.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network connection error. Please check your internet.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase Console.";
      default:
        return error.message || "Authentication failed. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth) {
        if (authMode === "signin") {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const user = userCredential.user;
          setSuccessMessage("Signed in successfully! Entering your dashboard...");
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "study_buddy_user",
              JSON.stringify({
                email: user.email,
                uid: user.uid,
                signedIn: true,
              })
            );
          }
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const user = userCredential.user;
          setSuccessMessage("Account created successfully! Entering your dashboard...");
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "study_buddy_user",
              JSON.stringify({
                email: user.email,
                uid: user.uid,
                signedIn: true,
              })
            );
          }
        }
      } else {
        // Fallback demo/unconfigured mode
        setSuccessMessage(
          authMode === "signin"
            ? "Signed in! Entering your dashboard..."
            : "Account created! Entering your dashboard..."
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "study_buddy_user",
            JSON.stringify({
              email: email.trim(),
              signedIn: true,
            })
          );
        }
      }

      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (error) {
      console.error("Firebase auth error:", error);
      setErrorMessage(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) return;

    try {
      if (isFirebaseConfigured() && auth) {
        await sendPasswordResetEmail(auth, targetEmail);
      }
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setIsForgotPasswordOpen(false);
        setResetEmail("");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      setErrorMessage(getFirebaseErrorMessage(error));
      setIsForgotPasswordOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-black/50 p-4 transition-colors duration-300 font-sans relative">
      {/* Top Controls Bar (Dashboard button removed; only theme toggle remains) */}
      <div className="absolute top-5 right-6 flex items-center gap-3 z-10">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md cursor-pointer shadow-md hover:scale-105 transition-all"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-700" />}
        </Button>
      </div>

      {/* Main Centered Auth Container */}
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Brand Title: Handwriting guides strictly in the logo */}
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-6xl text-black dark:text-white leading-tight font-['Playwrite_NZ_Basic_Guides'] drop-shadow-sm select-none">
            Study Buddy
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium tracking-normal">
            {authMode === "signin" ? "Sign in to your study room" : "Create your study account"}
          </p>
        </div>

        {/* Clean Frosted Auth Card */}
        <div className="w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-7 md:p-9 border border-white/50 dark:border-zinc-800 transition-all">
          {/* Segmented Sign In / Sign Up Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-300/60 dark:bg-zinc-800/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-medium text-center rounded-lg transition-all cursor-pointer ${
                authMode === "signin"
                  ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-medium text-center rounded-lg transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Configuration Hint (shown only if Firebase API key is still missing from .env.local) */}
          {!isConfigured && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Firebase config not yet linked in <code className="font-mono text-[11px]">.env.local</code>. Please authenticate the Firebase MCP or provide your API keys.
              </span>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs animate-in fade-in duration-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Authentication Form (Email & Password Only) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white/70 dark:bg-zinc-800/70 border-black/15 dark:border-zinc-700 rounded-xl focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  Password
                </Label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 text-sm bg-white/70 dark:bg-zinc-800/70 border-black/15 dark:border-zinc-700 rounded-xl focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {authMode === "signup" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-10 text-sm bg-white/70 dark:bg-zinc-800/70 border-black/15 dark:border-zinc-700 rounded-xl focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Toggle */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <label htmlFor="remember" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Action Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm shadow-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === "signin" ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          Study Buddy • Focused learning workspace
        </p>
      </div>

      {/* Forgot Password Modal Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Reset Password</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your email address and we will send you a reset link.
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">Please check your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={resetEmail || email}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-black dark:bg-white text-white dark:text-black"
                >
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
