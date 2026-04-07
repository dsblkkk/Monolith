import { useEffect } from "react";

/** 应用到 DOM：永远锁定暗色 */
function applyTheme() {
  const html = document.documentElement;
  html.classList.add("dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#0a0a0f");
  }
}

/** 全局主题 Hook（已精简：固定为暗色） */
export function useTheme() {
  useEffect(() => {
    applyTheme();
  }, []);

  return { theme: "dark" as const, setTheme: () => {} };
}

/** 主题切换按钮（已移除） */
export function ThemeToggle() {
  return null;
}
