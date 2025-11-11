/**
 * API proxy route to bypass CORS issues
 * Proxies requests to the backend server
 * Usage: /api/proxy/auth/staff/login instead of /auth/staff/login
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathString = path.join("/");
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/${pathString}`;

  try {
    const body = await request.json().catch(() => null);
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { detail: "Proxy request failed" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathString = path.join("/");
  const url = new URL(request.url);
  const queryString = url.search;
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/${pathString}${queryString}`;

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      credentials: "include",
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { detail: "Proxy request failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathString = path.join("/");
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/${pathString}`;

  try {
    const body = await request.json().catch(() => null);
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { detail: "Proxy request failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathString = path.join("/");
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/${pathString}`;

  try {
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      credentials: "include",
    });

    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { detail: "Proxy request failed" },
      { status: 500 },
    );
  }
}
