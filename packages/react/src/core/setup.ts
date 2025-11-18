import { context } from "./context";
import { VNode } from "./types";
import { removeInstance } from "./dom";
// import { cleanupUnusedHooks } from "./hooks";
import { render } from "./render";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  // 여기를 구현하세요.
  // 1. 컨테이너 유효성을 검사합니다.
  if (!container) {
    throw new Error("컨테이너가 제공되지 않았습니다.");
  }

  // 2. null 루트 엘리먼트는 렌더할 수 없습니다.
  if (rootNode === null) {
    throw new Error("루트 엘리먼트가 null입니다.");
  }

  // 3. 이전 렌더링 내용을 정리하고 컨테이너를 비웁니다.
  if (context.root.instance) {
    removeInstance(container, context.root.instance);
  }
  // 컨테이너의 모든 자식 노드를 제거
  container.innerHTML = "";

  // 4. 루트 컨텍스트와 훅 컨텍스트를 리셋합니다.
  context.root.reset({ container, node: rootNode });
  // 테스트 간 상태 초기화를 위해 state와 cursor도 초기화
  context.hooks.state.clear();
  context.hooks.cursor.clear();
  context.hooks.clear();

  // 5. 첫 렌더링을 실행합니다.
  render();
};
