import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const sdp = await request.text();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response('Missing OPENAI_API_KEY', { status: 500 });
  }

  // Forward SDP to OpenAI Realtime API
  const response = await fetch(
    'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/sdp',
      },
      body: sdp,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    return new Response(error, { status: response.status });
  }

  const answerSdp = await response.text();

  return new Response(answerSdp, {
    headers: {
      'Content-Type': 'application/sdp',
    },
  });
}
