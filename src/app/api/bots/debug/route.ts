import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const receivedSecret = req.headers.get("x-g1-bots-secret");
  const envSecret = process.env.G1_BOTS_SECRET;

  return NextResponse.json({
    receivedLength: receivedSecret?.length ?? 0,
    receivedPreview: receivedSecret
      ? receivedSecret.slice(0, 4) + "..." + receivedSecret.slice(-4)
      : null,
    envExists: !!envSecret,
    envLength: envSecret?.length ?? 0,
    envPreview: envSecret
      ? envSecret.slice(0, 4) + "..." + envSecret.slice(-4)
      : null,
    match: receivedSecret === envSecret,
    matchFirst16: (receivedSecret ?? "").slice(0, 16) === (envSecret ?? "").slice(0, 16)
  });
}