import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const receivedSecret = req.headers.get("x-g1-bots-secret");
  const envSecret = process.env.G1_BOTS_SECRET;
  const testDiag = process.env.TEST_DIAG;

  return NextResponse.json({
    // Secret debug
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

    // Second variable test
    testDiagValue: testDiag ?? null,

    // Show every env var name Vercel injected (names only, no values)
    allEnvNames: Object.keys(process.env)
      .filter((k) => !k.startsWith("npm_"))
      .sort()
  });
}