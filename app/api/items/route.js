import { NextResponse } from "next/server";
import { getClient, ensureSchema } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getClient();
    const items = await sql`
      SELECT id, title, description, created_at
      FROM items
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/items error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await request.json();
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const sql = getClient();
    const rows = await sql`
      INSERT INTO items (user_id, title, description)
      VALUES (${user.id}, ${title}, ${description || null})
      RETURNING id, title, description, created_at
    `;

    return NextResponse.json({ item: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/items error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
