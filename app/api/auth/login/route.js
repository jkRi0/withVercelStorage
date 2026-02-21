import { NextResponse } from "next/server";
import { login, seedDemoUser } from "../../../../lib/auth";
import { ensureSchema } from "../../../../lib/db";

export async function POST(request) {
  try {
    await ensureSchema();
    // Make sure the demo user exists before attempting login
    await seedDemoUser();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await login(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/auth/login error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
