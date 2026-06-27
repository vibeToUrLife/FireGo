import Link from "next/link";
import { googleEnabled } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next ?? "/dashboard";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Free, and your numbers stay yours. Save as many plans as you like.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm googleEnabled={googleEnabled} next={target} />
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
