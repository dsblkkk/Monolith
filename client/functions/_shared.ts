interface ApiEnv {
  API_BASE?: string;
}

const MISSING_API_BASE_MESSAGE =
  "Pages Functions 未配置 API_BASE。请在 Cloudflare Pages 项目中设置 API_BASE 后重新部署当前分支。";

export function getBackendUrl(env: ApiEnv): string | null {
  const backend = env.API_BASE?.trim();
  if (!backend) return null;
  return backend.replace(/\/+$/, "");
}

export function buildTargetUrl(backend: string, request: Request): string {
  const url = new URL(request.url);
  return `${backend}${url.pathname}${url.search}`;
}

export function createApiBaseErrorResponse(headers?: HeadersInit): Response {
  return new Response(
    JSON.stringify({
      error: "API_BASE_MISSING",
      message: MISSING_API_BASE_MESSAGE,
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...headers,
      },
    }
  );
}

export function createPlainApiBaseErrorResponse(headers?: HeadersInit): Response {
  return new Response(MISSING_API_BASE_MESSAGE, {
    status: 500,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}
