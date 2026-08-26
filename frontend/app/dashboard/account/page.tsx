"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOutIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function AccountPage() {
  const { data: session, status } = useSession()

  const user = session?.user
  const name = user?.name ?? ""
  const email = user?.email ?? ""
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Your profile information from the current session.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Details for the account you&apos;re signed in with.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-lg">
              <AvatarImage src={user?.image ?? undefined} alt={name} />
              <AvatarFallback className="rounded-lg text-lg">
                {status === "loading" ? "…" : initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              {status === "loading" ? (
                <>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : (
                <>
                  <span className="font-medium">
                    {name || "Unknown user"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {email || "No email on file"}
                  </span>
                </>
              )}
            </div>
          </div>

          <Separator />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-username">Username</FieldLabel>
              <Input id="account-username" value={name} readOnly disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input id="account-email" value={email} readOnly disabled />
            </Field>
          </FieldGroup>

          <Separator />

          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOutIcon />
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
