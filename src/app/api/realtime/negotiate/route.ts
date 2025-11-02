import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not set");
    }

    const offerSDP = await req.text();
    console.log(offerSDP)

    const response = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03&voice=coral", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        "Content-Type": "application/sdp",
      },
      body: offerSDP,
    });

    const answerSDP = await response.text();

    return new NextResponse(answerSDP, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
      },
    });
  } catch (error) {
    console.error("Negotiation error:", error);
    return new NextResponse("Failed to negotiate", { status: 500 });
  }
}
