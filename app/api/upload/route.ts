import { getUploadUrl, getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function slugifyFilename(filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  const base = filename.slice(0, filename.lastIndexOf("."));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9\-_\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return `${slug || crypto.randomUUID()}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Agent flow: JSON body with filename + contentType → return presigned URL
    if (contentType.includes("application/json")) {
      const { filename, contentType: fileContentType } = await req.json();
      if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

      const key = slugifyFilename(filename);
      const url = await getUploadUrl(key, fileContentType || "application/octet-stream");
      return NextResponse.json({ url, key });
    }

    // Browser flow: multipart form upload → PUT directly to R2
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const key = slugifyFilename(file.name);
    const uploadUrl = await getUploadUrl(key, file.type);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: new Uint8Array(await file.arrayBuffer()),
    });

    if (!res.ok) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

    return NextResponse.json({ key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
