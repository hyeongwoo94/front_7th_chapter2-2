import { setupWorker, http } from "msw/browser";
import { handlers } from "./handlers";
import { BASE_URL } from "../constants.js";

// base path를 제거한 경로로 정규화하는 함수
const normalizePath = (pathname) => {
  if (!pathname) return pathname;
  const base = BASE_URL.replace(/\/$/, ""); // 끝의 슬래시 제거
  if (pathname.startsWith(base)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
};

// 핸들러를 래핑하여 base path를 처리
const wrapHandlers = (handlers) => {
  return handlers.map((handler) => {
    // MSW 핸들러는 내부적으로 info 속성을 가지고 있음
    const handlerInfo = handler.info;
    if (!handlerInfo) return handler;

    const originalPath = handlerInfo.path;
    const method = handlerInfo.method.toLowerCase();

    // MSW v2에서는 http.get()에 함수를 첫 번째 인자로 전달할 수 있음
    // 이 함수는 RequestInfo를 받아서 boolean을 반환
    return http[method]((info) => {
      const requestUrl = new URL(info.request.url);
      const requestPath = normalizePath(requestUrl.pathname);

      // 원본 경로와 정규화된 경로 모두 매칭 시도
      // 동적 경로 파라미터도 고려 (예: /api/products/:id)
      if (requestPath === originalPath) return true;
      if (requestUrl.pathname === originalPath) return true;

      // 동적 경로 매칭 (예: /api/products/:id)
      const originalPattern = originalPath.replace(/:[^/]+/g, "[^/]+");
      const originalRegex = new RegExp(`^${originalPattern}$`);
      if (originalRegex.test(requestPath) || originalRegex.test(requestUrl.pathname)) {
        return true;
      }

      return false;
    }, handler.resolver);
  });
};

// MSW 워커 설정
// base path를 고려하여 핸들러 래핑
export const worker = setupWorker(...wrapHandlers(handlers));
