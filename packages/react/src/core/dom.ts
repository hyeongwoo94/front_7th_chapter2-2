/* eslint-disable @typescript-eslint/no-explicit-any */
// import { NodeType, NodeTypes } from "./constants";
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  // 여기를 구현하세요.
  if (!(dom instanceof HTMLElement)) return;

  for (const key in props) {
    if (key === "children") continue;

    const value = props[key];

    // 이벤트 핸들러 처리
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      (dom as any)[`__${eventType}Handler`] = value;
      dom.addEventListener(eventType, value);
      continue;
    }

    // style 처리
    if (key === "style" && typeof value === "object" && value !== null) {
      Object.assign((dom as HTMLElement).style, value);
      continue;
    }

    // className 처리
    if (key === "className") {
      dom.setAttribute("class", value);
      continue;
    }

    // htmlFor 처리
    if (key === "htmlFor") {
      dom.setAttribute("for", value);
      continue;
    }

    // 일반 속성
    (dom as any)[key] = value;
  }
};

/**
 * 이전 속성과 새로운 속성을 비교하여 DOM 요소의 속성을 업데이트합니다.
 * 변경된 속성만 효율적으로 DOM에 반영해야 합니다.
 */
export const updateDomProps = (
  dom: HTMLElement,
  prevProps: Record<string, any> = {},
  nextProps: Record<string, any> = {},
): void => {
  // 여기를 구현하세요.
  if (!(dom instanceof HTMLElement)) return;

  // 제거된 속성 처리
  for (const key in prevProps) {
    if (key === "children") continue;
    if (key in nextProps) continue;

    // 이벤트 핸들러 제거
    if (key.startsWith("on") && typeof prevProps[key] === "function") {
      const eventType = key.slice(2).toLowerCase();
      const handler = prevProps[key];
      dom.removeEventListener(eventType, handler);
      delete (dom as any)[`__${eventType}Handler`];
      continue;
    }

    // style 제거
    if (key === "style" && typeof prevProps[key] === "object") {
      (dom as HTMLElement).style.cssText = "";
      continue;
    }

    // className 제거
    if (key === "className") {
      dom.removeAttribute("class");
      continue;
    }

    // htmlFor 제거
    if (key === "htmlFor") {
      dom.removeAttribute("for");
      continue;
    }

    // 일반 속성 제거
    delete (dom as any)[key];
  }

  // 추가/변경된 속성 처리
  for (const key in nextProps) {
    if (key === "children") continue;
    if (prevProps[key] === nextProps[key]) continue;

    const value = nextProps[key];

    // 이벤트 핸들러 업데이트
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      const prevHandler = (dom as any)[`__${eventType}Handler`];
      if (prevHandler) {
        dom.removeEventListener(eventType, prevHandler);
      }
      (dom as any)[`__${eventType}Handler`] = value;
      dom.addEventListener(eventType, value);
      continue;
    }

    // style 업데이트
    if (key === "style" && typeof value === "object" && value !== null) {
      Object.assign((dom as HTMLElement).style, value);
      continue;
    }

    // className 업데이트
    if (key === "className") {
      dom.setAttribute("class", value);
      continue;
    }

    // htmlFor 업데이트
    if (key === "htmlFor") {
      dom.setAttribute("for", value);
      continue;
    }

    // 일반 속성 업데이트
    (dom as any)[key] = value;
  }
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  // 여기를 구현하세요.
  if (!instance) return [];

  const nodes: (HTMLElement | Text)[] = [];

  // instance.dom이 있으면 포함
  if (instance.dom) {
    nodes.push(instance.dom);
  }

  // instance.children 재귀 탐색
  if (instance.children) {
    for (const child of instance.children) {
      if (child) {
        nodes.push(...getDomNodes(child));
      }
    }
  }

  // instance.childInstance 재귀 탐색 (컴포넌트)
  if (instance.childInstance) {
    nodes.push(...getDomNodes(instance.childInstance));
  }

  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  // 여기를 구현하세요.
  if (!instance) return null;

  // instance.dom 있으면 반환
  if (instance.dom) {
    return instance.dom;
  }

  // instance.children에서 첫 DOM 찾기
  if (instance.children) {
    for (const child of instance.children) {
      if (child) {
        const dom = getFirstDom(child);
        if (dom) return dom;
      }
    }
  }

  // instance.childInstance에서 첫 DOM 찾기 (컴포넌트)
  if (instance.childInstance) {
    return getFirstDom(instance.childInstance);
  }

  return null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  // 여기를 구현하세요.
  if (!children) return null;

  for (const child of children) {
    if (child) {
      const dom = getFirstDom(child);
      if (dom) return dom;
    }
  }

  return null;
};

/**
 * 인스턴스를 부모 DOM에 삽입합니다.
 * anchor 노드가 주어지면 그 앞에 삽입하여 순서를 보장합니다.
 */
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  // 여기를 구현하세요.
  if (!instance) return;

  const nodes = getDomNodes(instance);

  for (const node of nodes) {
    if (anchor) {
      parentDom.insertBefore(node, anchor);
    } else {
      parentDom.appendChild(node);
    }
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  // 여기를 구현하세요.
  if (!instance) return;

  const nodes = getDomNodes(instance);

  // 역순으로 제거 (인덱스 오류 방지)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.parentNode === parentDom) {
      parentDom.removeChild(node);
    }
  }
};
