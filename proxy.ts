import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const TRUSTED_CIDR = "192.168.4.0/22";

function isInCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const toInt = (addr: string) =>
    addr.split(".").reduce((acc, o) => ((acc << 8) | parseInt(o)) >>> 0, 0);
  return (toInt(ip) & mask) === (toInt(network) & mask);
}

function getIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
}

export async function proxy(request: NextRequest) {
  const ip = getIp(request);
  if (ip && isInCidr(ip, TRUSTED_CIDR)) {
    return NextResponse.next();
  }

  const session = await getSession(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/auth|login).*)"],
};
