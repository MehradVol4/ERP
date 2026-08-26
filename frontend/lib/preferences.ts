"use client"

import { useEffect, useState } from "react"

/**
 * App-level display preferences. These are UI/formatting choices with no
 * backend field to store them, so they live in localStorage (per browser)
 * and are read by the dashboard cards and chart.
 */
export type CurrencyCode = "USD" | "EUR" | "IRR" | "IRT"

export type Preferences = {
  currency: CurrencyCode
  lowStockThreshold: number
}

export const DEFAULT_PREFERENCES: Preferences = {
  currency: "USD",
  lowStockThreshold: 10,
}

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "IRR", label: "Iranian Rial (﷼)" },
  { value: "IRT", label: "Toman" },
]

const STORAGE_KEY = "erp-preferences"
const EVENT = "erp-preferences-changed"

/** Format an amount using the chosen currency; Toman is not an ISO code. */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  if (currency === "IRT") {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(amount))} Toman`
  }
  const fractionDigits = currency === "IRR" ? 0 : 2
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}

function sanitize(raw: unknown): Preferences {
  if (typeof raw !== "object" || raw === null) return DEFAULT_PREFERENCES
  const value = raw as Partial<Preferences>
  const currency = CURRENCY_OPTIONS.some((o) => o.value === value.currency)
    ? (value.currency as CurrencyCode)
    : DEFAULT_PREFERENCES.currency
  const threshold =
    typeof value.lowStockThreshold === "number" &&
    Number.isFinite(value.lowStockThreshold) &&
    value.lowStockThreshold >= 0
      ? Math.floor(value.lowStockThreshold)
      : DEFAULT_PREFERENCES.lowStockThreshold
  return { currency, lowStockThreshold: threshold }
}

export function getPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFERENCES
    return sanitize(JSON.parse(stored))
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function setPreferences(patch: Partial<Preferences>): Preferences {
  const next = sanitize({ ...getPreferences(), ...patch })
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent<Preferences>(EVENT, { detail: next }))
  } catch {
    // Storage unavailable (private mode, etc.) — ignore; defaults still apply.
  }
  return next
}

/**
 * Subscribe to preferences. Starts from defaults on the server and first
 * client paint (avoids hydration mismatch), then syncs from storage and
 * updates live when preferences change in this or another tab.
 */
export function usePreferences(): Preferences {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    setPrefs(getPreferences())

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Preferences>).detail
      setPrefs(detail ?? getPreferences())
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(getPreferences())
    }

    window.addEventListener(EVENT, onChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return prefs
}
