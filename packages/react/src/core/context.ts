import { Context } from "./types";

/**
 * Mini-React의 전역 컨텍스트입니다.
 * 렌더링 루트, 훅 상태, 이펙트 큐 등 모든 런타임 데이터를 관리합니다.
 */
export const context: Context = {
  /**
   * 렌더링 루트와 관련된 정보를 관리합니다.
   */
  root: {
    container: null,
    node: null,
    instance: null,
    reset({ container, node }) {
      // 여기를 구현하세요.
      // container, node, instance를 전달받은 값으로 초기화합니다.
      this.container = container;
      this.node = node;
      this.instance = null;
    },
  },

  /**
   * 훅의 상태를 관리합니다.
   * 컴포넌트 경로(path)를 키로 사용하여 각 컴포넌트의 훅 상태를 격리합니다.
   */
  hooks: {
    state: new Map(),
    cursor: new Map(),
    visited: new Set(),
    componentStack: [],

    /**
     * 모든 훅 관련 상태를 초기화합니다.
     */
    clear() {
      // 여기를 구현하세요.
      // state, cursor, visited, componentStack을 모두 비웁니다.
      this.visited.clear();
      this.componentStack = [];
      // state와 cursor는 유지 (훅 상태 보존)
    },

    /**
     * 현재 실행 중인 컴포넌트의 고유 경로를 반환합니다.
     */
    get currentPath() {
      // 여기를 구현하세요.
      // componentStack의 마지막 요소를 반환해야 합니다.
      // 스택이 비어있으면 '훅은 컴포넌트 내부에서만 호출되어야 한다'는 에러를 발생시켜야 합니다.
      const path = this.componentStack[this.componentStack.length - 1];
      if (!path) {
        throw new Error("훅은 컴포넌트 내부에서만 호출되어야 합니다.");
      }
      return path;
    },

    /**
     * 현재 컴포넌트에서 다음에 실행될 훅의 인덱스(커서)를 반환합니다.
     */
    get currentCursor() {
      // 여기를 구현하세요.
      // cursor Map에서 현재 경로의 커서를 가져옵니다. 없으면 0을 반환합니다.
      const path = this.currentPath;
      return this.cursor.get(path) ?? 0;
    },

    /**
     * 현재 컴포넌트의 훅 상태 배열을 반환합니다.
     */
    get currentHooks() {
      // 여기를 구현하세요.
      // state Map에서 현재 경로의 훅 배열을 가져옵니다. 없으면 빈 배열을 반환합니다.
      const path = this.currentPath;
      return this.state.get(path) ?? [];
    },
  },

  /**
   * useEffect 훅의 실행을 관리하는 큐입니다.
   */
  effects: {
    queue: [],
  },
};

/**
 * 컴포넌트 진입 시 호출됩니다. 컴포넌트 스택에 경로를 추가하고 커서를 초기화합니다.
 * @param path - 컴포넌트의 고유 경로
 */
export const enterComponent = (path: string): void => {
  // 여기를 구현하세요.
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.visited.add(path);
};

/**
 * 컴포넌트 종료 시 호출됩니다. 컴포넌트 스택에서 경로를 제거합니다.
 */
export const exitComponent = (): void => {
  // 여기를 구현하세요.
  context.hooks.componentStack.pop();
};

/**
 * 현재 컴포넌트의 훅 커서를 증가시킵니다.
 * @param path - 컴포넌트의 고유 경로
 */
export const incrementCursor = (path: string): void => {
  // 여기를 구현하세요.
  const current = context.hooks.cursor.get(path) ?? 0;
  context.hooks.cursor.set(path, current + 1);
};
