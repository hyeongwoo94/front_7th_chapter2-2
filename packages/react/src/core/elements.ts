/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (value: string | number): VNode => {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      children: [],
      nodeValue: String(value),
    },
  };
};

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // 여기를 구현하세요.
  if (isEmptyValue(node as unknown)) {
    return null;
  }

  if (node && typeof node === "object" && "type" in node && "props" in node) {
    // Fragment 타입 체크
    if (node.type === Fragment) {
      return node;
    }
    return node;
  }

  if (typeof (node as unknown) === "string" || typeof (node as unknown) === "number") {
    return createTextElement(node as unknown as string | number);
  }

  return null;
};

/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
): VNode => {
  // 여기를 구현하세요.
  // type이 undefined이면 null을 반환하여 아무것도 렌더링하지 않음
  if (type === undefined || type === null) {
    // null을 반환할 수 없으므로 빈 Fragment를 반환
    return {
      type: Fragment,
      key: null,
      props: { children: [] },
    };
  }

  const { key, ...props } = originProps || {};

  const normalizeChildren = (children: any[]): VNode[] => {
    const normalized: VNode[] = [];

    for (const child of children) {
      if (Array.isArray(child)) {
        const flattened = normalizeChildren(child);
        normalized.push(...flattened);
        continue;
      }

      const normalizedChild = normalizeNode(child as VNode);
      if (normalizedChild) {
        normalized.push(normalizedChild);
      }
    }

    return normalized;
  };

  const children = normalizeChildren(rawChildren);

  if (children.length > 0) {
    props.children = children;
  }

  return {
    type,
    key: key ?? null,
    props,
  };
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
export const createChildPath = (
  parentPath: string,
  key: string | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  // 여기를 구현하세요.
  if (key !== null && key !== undefined) {
    return `${parentPath}.i${key}`;
  }

  // nodeType과 siblings를 사용하여 더 정확한 경로 생성
  // 같은 타입의 노드가 여러 개 있을 때 구분하기 위해 사용
  if (nodeType && siblings) {
    // 같은 타입의 노드 중에서 현재 인덱스 이전에 몇 개가 있는지 계산
    let sameTypeCount = 0;
    for (let i = 0; i < index; i++) {
      if (siblings[i] && siblings[i].type === nodeType) {
        sameTypeCount++;
      }
    }
    if (sameTypeCount > 0) {
      return `${parentPath}.c${index}.t${String(nodeType)}.n${sameTypeCount}`;
    }
  }

  return `${parentPath}.c${index}`;
};
