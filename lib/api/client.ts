import { ApiError, type ApiResponse } from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string | number | boolean | undefined>;
}

interface RequestOptionsWithBody extends RequestOptions {
  body?: unknown;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = new URL(path, base || "http://localhost:3000");

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Return just path+search when no explicit base is configured
  return base ? url.toString() : `${url.pathname}${url.search}`;
}

async function parseError(response: Response): Promise<ApiError> {
  let body = { message: response.statusText };
  try {
    const json = await response.json();
    body = typeof json === "object" && json !== null ? json : body;
  } catch {
    // non-JSON error body — keep default
  }
  return new ApiError(response.status, body);
}

async function request<T>(
  method: HttpMethod,
  path: string,
  { body, params, ...init }: RequestOptionsWithBody = {},
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, params);

  const headers = new Headers(init.headers);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const data: T =
    response.status === 204 ? (undefined as T) : await response.json();

  return { data, status: response.status };
}

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>("GET", path, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("POST", path, { ...options, body });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PUT", path, { ...options, body });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>("PATCH", path, { ...options, body });
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>("DELETE", path, options);
  },
};
