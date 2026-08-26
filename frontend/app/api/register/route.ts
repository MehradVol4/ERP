import { NextResponse } from "next/server"

type RegisterBody = {
  username?: string
  email?: string
  password?: string
}

export async function POST(request: Request) {
  let body: RegisterBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid request body." } },
      { status: 400 },
    )
  }

  const username = body.username?.trim()
  const email = body.email?.trim()
  const password = body.password

  if (!username || !email || !password) {
    return NextResponse.json(
      { error: { message: "Username, email, and password are required." } },
      { status: 400 },
    )
  }

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL

  if (!strapiUrl) {
    return NextResponse.json(
      { error: { message: "Server is misconfigured (missing Strapi URL)." } },
      { status: 500 },
    )
  }

  let res: Response
  try {
    res = await fetch(`${strapiUrl}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
  } catch {
    return NextResponse.json(
      { error: { message: "Could not reach the authentication server." } },
      { status: 502 },
    )
  }

  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.jwt) {
    const message =
      data?.error?.message || "Registration failed. Please try again."
    return NextResponse.json({ error: { message } }, { status: res.status || 400 })
  }

  // Return only what the client needs; the NextAuth session is established
  // afterwards via the credentials sign-in flow.
  return NextResponse.json({ user: data.user }, { status: 200 })
}
