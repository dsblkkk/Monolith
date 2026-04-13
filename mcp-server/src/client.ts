/* ──────────────────────────────────────────────
   Monolith MCP 服务器 — HTTP 客户端
   封装认证逻辑与请求方法，自动管理 JWT 生命周期
   ────────────────────────────────────────────── */

/** 缓存的认证令牌与过期时间 */
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // Unix 时间戳（秒）

/** 从环境变量读取配置 */
function getConfig() {
  const apiUrl = process.env.MONOLITH_API_URL;
  const password = process.env.MONOLITH_PASSWORD;

  if (!apiUrl || !password) {
    throw new Error(
      "缺少环境变量 MONOLITH_API_URL 或 MONOLITH_PASSWORD，请在 MCP 配置中设置。"
    );
  }

  return { apiUrl: apiUrl.replace(/\/$/, ""), password };
}

/** 登录获取 JWT Token */
async function login(): Promise<string> {
  const { apiUrl, password } = getConfig();

  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`登录失败 (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token: string };
  cachedToken = data.token;
  // JWT 有效期 7 天，提前 1 小时刷新
  tokenExpiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600 - 3600;

  console.error("[Monolith MCP] 认证成功，JWT Token 已缓存。");
  return cachedToken;
}

/** 获取有效的 Token（自动登录/续签） */
async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }
  return login();
}

/** 通用请求方法 */
export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    auth?: boolean; // 默认 true，公开 API 可设为 false
  } = {}
): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;
  const { apiUrl } = getConfig();

  // 构建完整 URL
  let url = `${apiUrl}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  // 构建请求头
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 发起请求
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API 请求失败 ${method} ${path} (${res.status}): ${errorText}`);
  }

  // 空响应兼容
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
