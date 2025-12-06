import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UpdatePasswordForm from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="mt-20 flex flex-1 flex-col items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
