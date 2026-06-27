import Link from "next/link";
import { googleEnabled } from "@/auth";
import { getDict } from "@/lib/i18n/server";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Next.js 16: searchParams arrives as a Promise.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next ?? "/dashboard";
  const t = await getDict();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t.authPages.loginTitle}</CardTitle>
          <CardDescription>{t.authPages.loginDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm googleEnabled={googleEnabled} next={target} />
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        {t.authPages.newHere}{" "}
        <Link
          href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-primary font-medium hover:underline"
        >
          {t.authPages.createAnAccount}
        </Link>
      </p>
    </div>
  );
}
