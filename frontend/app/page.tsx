import Link from "next/link";
import { IconArrowRight, IconLayoutDashboard } from "@tabler/icons-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Badge variant="secondary" className="mb-2">
            ERP System
          </Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Manage your products, sales, and reports from one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <IconLayoutDashboard />
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full",
            )}
          >
            Sign in
            <IconArrowRight />
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
