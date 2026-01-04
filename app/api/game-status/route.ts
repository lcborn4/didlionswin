// Next.js API route handler for game-status - wraps Lambda handler for local development
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid webpack issues with ESM modules
    const { handler } = await import('../../../api/game-status.js');
    
    // Convert Next.js request to Lambda event format
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    };

    // Call the Lambda handler
    const result = await handler(event, {} as any);

    // Convert Lambda response to Next.js response
    // Filter out undefined values from headers
    const headerEntries: [string, string][] = result.headers 
      ? Object.entries(result.headers).filter(([_, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
      : [];
    const headers = new Headers(headerEntries);
    const body = result.body;

    return new NextResponse(body, {
      status: result.statusCode,
      headers: headers
    });
  } catch (error: any) {
    console.error('Game status API error:', error);
    return NextResponse.json(
      { error: 'Failed to check game status', message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400'
    }
  });
}

