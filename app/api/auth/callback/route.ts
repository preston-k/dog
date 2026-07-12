import { NextRequest, NextResponse } from "next/server";
import { getOidcConfig, createSession, SESSION_COOKIE, STATE_COOKIE, VERIFIER_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get(STATE_COOKIE)?.value;
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value;

  if (!code || !state || state !== storedState || !verifier) {
    return new NextResponse("Invalid state", { status: 400 });
  }

  const config = await getOidcConfig();

  const tokenRes = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.OIDC_REDIRECT_URI!,
      client_id: process.env.OIDC_CLIENT_ID!,
      client_secret: process.env.OIDC_CLIENT_SECRET!,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("Token exchange failed:", text);
    return new NextResponse("Token exchange failed", { status: 502 });
  }

  const tokens = await tokenRes.json();

  // Decode the ID token payload (we trust it came from our verified OIDC provider over HTTPS)
  const [, payloadB64] = (tokens.id_token as string).split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

  const sessionToken = await createSession({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  });

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(VERIFIER_COOKIE);
  return res;
}
