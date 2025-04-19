
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await forgotPassword(email);
      
      if (success) {
        setIsSubmitted(true);
        toast({
          title: "Reset link sent",
          description: "If an account with this email exists, a password reset link has been sent.",
        });
      } else {
        toast({
          title: "Failed to send reset link",
          description: "There was a problem sending the password reset link. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M2 4v16a2 2 0 0 0 2 2h16" />
            <path d="M3.04 16.949a3 3 0 0 1 2.378-1.013h.868a3 3 0 0 1 2.943 3.064" />
            <path d="M8 21h1" />
            <circle cx="11" cy="11" r="3" />
            <path d="m18 2-1.5 1.5" />
            <path d="m21 5-1.5 1.5" />
            <path d="m18 8-1.5-1.5" />
            <path d="m15 5-1.5-1.5" />
            <path d="M13.5 9.5 9 14" />
          </svg>
          <span className="font-bold text-lg">Kalimaya Storage</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="bg-muted p-6 rounded-lg text-center space-y-4">
              <h3 className="text-lg font-medium">Reset Link Sent</h3>
              <p>
                If an account exists with the email {email}, you will receive a password reset link shortly.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/login">Return to Login</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>© 2025 Kalimaya Storage. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ForgotPassword;
