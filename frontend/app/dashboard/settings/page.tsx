"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import axiosInstance from "@/lib/axios"
import { handleApiError } from "@/lib/handleApiError"
import {
  CURRENCY_OPTIONS,
  usePreferences,
  setPreferences,
  type CurrencyCode,
} from "@/lib/preferences"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const prefs = usePreferences()

  // --- Profile ---
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name ?? "")
      setEmail(session.user.email ?? "")
    }
  }, [session?.user])

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const userId = session?.user?.id
    if (!userId) {
      toast.error("You must be signed in to update your profile.")
      return
    }
    setSavingProfile(true)
    try {
      await axiosInstance.put(`/api/users/${userId}`, {
        username: username.trim(),
        email: email.trim(),
      })
      // Reflect the change in the NextAuth session immediately.
      await update({ name: username.trim(), email: email.trim() })
      toast.success("Profile updated.")
    } catch (error) {
      toast.error(handleApiError(error, "Couldn't update your profile."))
    } finally {
      setSavingProfile(false)
    }
  }

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    setSavingPassword(true)
    try {
      await axiosInstance.post("/api/auth/change-password", {
        currentPassword,
        password: newPassword,
        passwordConfirmation: confirmPassword,
      })
      toast.success("Password changed.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(handleApiError(error, "Couldn't change your password."))
    } finally {
      setSavingPassword(false)
    }
  }

  // --- Preferences ---
  const [threshold, setThreshold] = useState(String(prefs.lowStockThreshold))

  useEffect(() => {
    setThreshold(String(prefs.lowStockThreshold))
  }, [prefs.lowStockThreshold])

  function handleCurrencyChange(value: string | null) {
    if (!value) return
    setPreferences({ currency: value as CurrencyCode })
    toast.success("Currency updated.")
  }

  function handleThresholdBlur() {
    const parsed = Number(threshold)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setThreshold(String(prefs.lowStockThreshold))
      return
    }
    const next = Math.floor(parsed)
    if (next !== prefs.lowStockThreshold) {
      setPreferences({ lowStockThreshold: next })
      toast.success("Low-stock threshold updated.")
    }
    setThreshold(String(next))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, security, and dashboard preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update the name and email on your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={status === "loading"}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  required
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={savingProfile || status === "loading"}
                  className="w-fit"
                >
                  {savingProfile && <Spinner />}
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change the password you use to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPassword">
                  Current password
                </FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <FieldDescription>
                  Must be at least 6 characters.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="w-fit"
                >
                  {savingPassword && <Spinner />}
                  {savingPassword ? "Updating..." : "Change password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            How amounts and inventory are displayed across the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Select value={prefs.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Used for revenue on the dashboard cards and chart.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="threshold">Low-stock threshold</FieldLabel>
              <Input
                id="threshold"
                type="number"
                min={0}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                onBlur={handleThresholdBlur}
                className="w-40"
              />
              <FieldDescription>
                Products with stock at or below this number are flagged as low
                stock.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
