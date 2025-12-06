import AuthForm from "@/components/AuthForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import LoginToaster from "@/components/LoginToaster";

function LoginPage() {
  return (
    <>
      <LoginToaster />
      <div className="mt-20 flex flex-1 flex-col items-center">
        <Card className="w-full max-w-md">
          <AuthForm type="login" />
        </Card>
      </div>
    </>
  );
}

export default LoginPage;
