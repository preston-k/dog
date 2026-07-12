import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "dog_session";
const STATE_COOKIE = "dog_oidc_state";
const VERIFIER_COOKIE = "dog_oidc_verifier";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export interface Session {
  sub: string;
  email?: string;
  name?: string;
}

let oidcConfig: { authorization_endpoint: string; token_endpoint: string; jwks_uri: string } | null = null;

export async function getOidcConfig() {
  if (oidcConfig) return oidcConfig;
  const res = await fetch(`${process.env.OIDC_ISSUER}/.well-known/openid-configuration`);
  oidcConfig = await res.json();
  return oidcConfig!;
}

export async function createSession(payload: Session): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { SESSION_COOKIE, STATE_COOKIE, VERIFIER_COOKIE };
