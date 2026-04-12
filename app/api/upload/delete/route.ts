import { deleteFromR2 } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(req: NextRequest) {
  try {
    const { key } = await req.json();
    
    if (!key) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }
    
    await deleteFromR2(key);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
