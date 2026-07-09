"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useTransition, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { loginAction, signUpAction } from "@/actions/users";
import { cn } from "@/lib/utils";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { DateOfBirthPicker } from "./DateOfBirthPicker";
import TurnstileCaptcha from "./TurnstileCaptcha";

type Props = {
  type: "login" | "signUp";
  className?: string;
} & React.ComponentProps<"div">;

function AuthForm({ type, className, ...props }: Props) {
  const isLoginForm = type === "login";

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [requiresCaptcha, setRequiresCaptcha] = useState(!isLoginForm); // Always require for signup
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    console.error("❌ CAPTCHA error");
    setCaptchaToken(null);
    setRequiresCaptcha(true); // Keep CAPTCHA visible on error
    toast("CAPTCHA Error", {
      description: "CAPTCHA verification failed. Please try again.",
    });
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    console.warn("⚠️ CAPTCHA expired");
    setCaptchaToken(null);
    setRequiresCaptcha(true); // Keep CAPTCHA visible when expired
    toast("CAPTCHA Expired", {
      description: "CAPTCHA has expired. Please complete it again.",
    });
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const email = formData.get("email") as string;
        const passwordValue = formData.get("password") as string;

        if (!isLoginForm) {
          // For signup, always require CAPTCHA
          if (!captchaToken) {
            toast("CAPTCHA Required", {
              description: "Please complete the CAPTCHA verification.",
            });
            return;
          }

          const firstName = formData.get("firstName") as string;
          const lastName = formData.get("lastName") as string;
          const confirmPasswordValue = formData.get(
            "confirmPassword",
          ) as string;

          // Validate required fields
          if (!firstName || !lastName || !dob) {
            toast("Error", {
              description: "Please fill in all required fields",
            });
            return;
          }

          if (passwordValue !== confirmPasswordValue) {
            toast("Error", {
              description: "Passwords do not match",
            });
            return;
          }

          const result = await signUpAction(
            email,
            passwordValue,
            firstName,
            lastName,
            dob,
            captchaToken, // Pass CAPTCHA token to server
          );

          // Update CAPTCHA requirement based on server response
          if (result?.requiresCaptcha) {
            setRequiresCaptcha(true);
            setCaptchaToken(null); // Reset token for next attempt
          }

          if (!result?.errorMessage) {
            // Check if email verification is required
            if (result?.requiresEmailVerification) {
              toast("Check your email", {
                description:
                  "We've sent you a verification link. Please check your email and click the link to verify your account before logging in.",
                duration: 10000,
              });
              // Don't redirect - let user see the message
            } else {
              router.replace(`/?toastType=${type}`);
            }
          } else {
            toast("Error", {
              description: result.errorMessage,
            });
          }
        } else {
          // For login, CAPTCHA is only required after first failed attempt
          // The server will tell us if CAPTCHA is required
          const result = await loginAction(
            email,
            passwordValue,
            captchaToken || undefined,
          );

          if (result?.requiresCaptcha) {
            setRequiresCaptcha(true);
            // Only reset token if there was an error
            if (result?.errorMessage) {
              setCaptchaToken(null); // Reset token for next attempt
            }
          } else {
            // Clear CAPTCHA on successful login
            setRequiresCaptcha(false);
            setCaptchaToken(null);
          }

          if (!result?.errorMessage) {
            router.replace(`/?toastType=${type}`);
          } else {
            toast("Error", {
              description: result.errorMessage,
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast("Error", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred. Please try again.",
        });
      }
    });
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple login
    toast("Coming Soon", {
      description: "Apple login will be implemented soon",
    });
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google login
    toast("Coming Soon", {
      description: "Google login will be implemented soon",
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {isLoginForm ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isLoginForm
            ? "Login with your Apple or Google account"
            : "Sign up with your Apple or Google account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAppleLogin}
              disabled={isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
              >
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              {isLoginForm ? "Login with Apple" : "Sign up with Apple"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
              >
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              {isLoginForm ? "Login with Google" : "Sign up with Google"}
            </Button>
          </div>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>

          <form action={handleSubmit}>
            <div className="grid gap-6">
              {!isLoginForm && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <DateOfBirthPicker
                    value={dob}
                    onChange={setDob}
                    disabled={isPending}
                    required
                  />
                </>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {isLoginForm && (
                    <Link
                      href="/forgot-password"
                      className={`ml-auto text-sm underline-offset-4 hover:underline ${
                        isPending ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    disabled={isPending}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {!isLoginForm && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </div>
              {!isLoginForm && (
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      disabled={isPending}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      disabled={isPending}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-foreground text-xs">
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
              {requiresCaptcha && (
                <div className="flex justify-center">
                  <TurnstileCaptcha
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    onExpire={handleCaptchaExpire}
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || (requiresCaptcha && !captchaToken)}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isLoginForm ? (
                  "Login"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm">
            {isLoginForm
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <Link
              href={isLoginForm ? "/sign-up" : "/login"}
              className={`underline underline-offset-4 ${
                isPending ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {isLoginForm ? "Sign up" : "Login"}
            </Link>
          </div>
        </div>
      </CardContent>

      {!isLoginForm && (
        <div className="text-muted-foreground text-center text-xs text-balance">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline underline-offset-4"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </div>
      )}
    </div>
  );
}

export default AuthForm;
