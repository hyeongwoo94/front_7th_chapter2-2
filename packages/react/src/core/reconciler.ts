import { enterComponent, exitComponent } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import {
  getDomNodes,
  getFirstDom,
  getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @returns 업데이트되거나 새로 생성된 인스턴스
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  // 여기를 구현하세요.
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  if (node === null) {
    if (instance) {
      removeInstance(parentDom, instance);
    }
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (!instance) {
    return mount(parentDom, node, path);
  }

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return mount(parentDom, node, path);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  return update(instance, node, parentDom, path);
};

/**
 * 새로운 VNode를 DOM으로 생성합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  // TEXT_ELEMENT 처리
  if (node.type === TEXT_ELEMENT) {
    const props = node.props || {};
    const textNode = document.createTextNode(props.nodeValue || "");
    const instance: Instance = {
      kind: NodeTypes.TEXT,
      dom: textNode,
      node,
      children: [],
      key: node.key,
      path,
    };
    parentDom.appendChild(textNode);
    return instance;
  }

  // Fragment 처리
  if (node.type === Fragment) {
    const props = node.props || {};
    const children = (props.children || []) as VNode[];
    const childInstances: (Instance | null)[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (isEmptyValue(child)) continue;

      const childPath = createChildPath(path, child.key, i, child.type, children);
      const childInstance = mount(parentDom, child, childPath);
      childInstances.push(childInstance);
    }

    const instance: Instance = {
      kind: NodeTypes.FRAGMENT,
      dom: null,
      node,
      children: childInstances,
      key: node.key,
      path,
    };

    instance.dom = getFirstDomFromChildren(childInstances);
    return instance;
  }

  // 컴포넌트 처리
  if (typeof node.type === "function") {
    return mountComponent(parentDom, node, path);
  }

  // DOM 요소 처리
  const dom = document.createElement(node.type as string);
  const props = node.props || {};
  setDomProps(dom as HTMLElement, props);

  const children = (props.children || []) as VNode[];
  const childInstances: (Instance | null)[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isEmptyValue(child)) continue;

    const childPath = createChildPath(path, child.key, i, child.type, children);
    const childInstance = mount(dom as HTMLElement, child, childPath);
    childInstances.push(childInstance);
  }

  const instance: Instance = {
    kind: NodeTypes.HOST,
    dom: dom as HTMLElement,
    node,
    children: childInstances,
    key: node.key,
    path,
  };

  parentDom.appendChild(dom);
  return instance;
};

/**
 * 함수 컴포넌트를 마운트합니다.
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = node.type as React.ComponentType<Record<string, any>>;
  const componentPath = createChildPath(path, node.key, 0, node.type);

  enterComponent(componentPath);

  try {
    const childNode = Component(node.props || {});
    if (childNode === null || childNode === undefined) {
      const instance: Instance = {
        kind: NodeTypes.COMPONENT,
        dom: null,
        node,
        children: [],
        key: node.key,
        path: componentPath,
        childInstance: null,
      };
      return instance;
    }

    const childPath = createChildPath(componentPath, childNode.key, 0, childNode.type);
    const childInstance = mount(parentDom, childNode, childPath);

    const instance: Instance = {
      kind: NodeTypes.COMPONENT,
      dom: getFirstDom(childInstance),
      node,
      children: [],
      key: node.key,
      path: componentPath,
      childInstance,
    };

    return instance;
  } finally {
    exitComponent();
  }
};

/**
 * 기존 인스턴스를 업데이트합니다.
 */
const update = (oldInstance: Instance, newNode: VNode, parentDom: HTMLElement, path: string): Instance => {
  // TEXT_ELEMENT 처리
  if (oldInstance.kind === NodeTypes.TEXT && newNode.type === TEXT_ELEMENT) {
    if (oldInstance.dom) {
      const props = newNode.props || {};
      (oldInstance.dom as Text).nodeValue = props.nodeValue || "";
    }
    oldInstance.node = newNode;
    return oldInstance;
  }

  // Fragment 처리
  if (oldInstance.kind === NodeTypes.FRAGMENT && newNode.type === Fragment) {
    const props = newNode.props || {};
    reconcileChildren(parentDom, oldInstance, (props.children || []) as VNode[], path);
    oldInstance.dom = getFirstDomFromChildren(oldInstance.children);
    oldInstance.node = newNode;
    return oldInstance;
  }

  // 컴포넌트 처리
  if (oldInstance.kind === NodeTypes.COMPONENT) {
    return updateComponent(oldInstance, newNode, parentDom);
  }

  // DOM 요소 처리
  // 타입이 다르면 새로운 DOM 요소를 생성해야 함
  if (oldInstance.kind === NodeTypes.HOST) {
    const oldType = oldInstance.node.type as string;
    const newType = newNode.type as string;

    if (oldType !== newType) {
      // 타입이 다르면 기존 DOM을 제거하고 새로 마운트
      if (oldInstance.dom && oldInstance.dom.parentNode) {
        oldInstance.dom.parentNode.removeChild(oldInstance.dom);
      }
      removeInstance(parentDom, oldInstance);
      return mount(parentDom, newNode, path);
    }
  }

  if (oldInstance.dom) {
    const oldProps = oldInstance.node.props || {};
    const newProps = newNode.props || {};
    updateDomProps(oldInstance.dom as HTMLElement, oldProps, newProps);
  }

  const domForChildren = (oldInstance.dom as HTMLElement) || parentDom;
  const props = newNode.props || {};
  reconcileChildren(domForChildren, oldInstance, (props.children || []) as VNode[], path);

  oldInstance.node = newNode;
  return oldInstance;
};

/**
 * 함수 컴포넌트를 업데이트합니다.
 */
const updateComponent = (oldInstance: Instance, newNode: VNode, parentDom: HTMLElement): Instance => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = newNode.type as React.ComponentType<Record<string, any>>;
  const path = oldInstance.path;

  enterComponent(path);

  try {
    const childNode = Component(newNode.props || {});
    if (childNode === null || childNode === undefined) {
      if (oldInstance.childInstance) {
        removeInstance(parentDom, oldInstance.childInstance);
      }
      oldInstance.childInstance = null;
      oldInstance.dom = null;
      oldInstance.node = newNode;
      return oldInstance;
    }

    const container = oldInstance.childInstance?.dom
      ? (oldInstance.childInstance.dom as HTMLElement).parentElement || parentDom
      : parentDom;

    const childPath = createChildPath(path, childNode.key, 0, childNode.type);
    const childInstance = reconcile(container as HTMLElement, oldInstance.childInstance || null, childNode, childPath);

    oldInstance.childInstance = childInstance;
    oldInstance.dom = getFirstDom(childInstance);
    oldInstance.node = newNode;

    return oldInstance;
  } finally {
    exitComponent();
  }
};

/**
 * 자식 노드들을 재조정합니다.
 * 명세서 3. 리컨실리에이션과 자식 비교 전략 참고
 *
 * 알고리즘:
 * 1. Key 기반 Map 생성
 * 2. 새 자식들을 순회하며 매칭 및 reconcile
 * 3. 순서가 변경된 자식들을 올바른 위치로 이동 (역순 처리)
 * 4. 사용되지 않은 기존 자식 제거
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  instance: Instance,
  newChildren: VNode[],
  parentPath: string,
): void => {
  const oldChildren = instance.children || [];
  const childInstances: (Instance | null)[] = [];

  // 1단계: Key 기반 Map 생성 및 인덱스 추적
  const keyMap = new Map<string | number, Instance>();
  const oldIndexMap = new Map<Instance, number>();
  for (let idx = 0; idx < oldChildren.length; idx++) {
    const oldChild = oldChildren[idx];
    if (oldChild) {
      oldIndexMap.set(oldChild, idx);
      if (oldChild.key !== null) {
        keyMap.set(oldChild.key, oldChild);
      }
    }
  }

  const usedKeys = new Set<string | number>();
  const usedInstances = new Set<Instance>();
  const renderedOldChildren = oldChildren.filter((child) => child !== null);
  let renderedOldIndex = 0;

  // 2단계: 새 자식들을 순회하며 매칭 및 reconcile
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    // 조건부 렌더링으로 인한 null/false 처리
    if (isEmptyValue(newChild)) {
      childInstances.push(null);
      continue;
    }

    const childPath = createChildPath(parentPath, newChild.key, i, newChild.type, newChildren);
    let childInstance: Instance | null = null;

    // 2-1: Key로 매칭
    if (newChild.key !== null && keyMap.has(newChild.key)) {
      const matched = keyMap.get(newChild.key)!;
      if (matched.node.type === newChild.type) {
        childInstance = reconcile(parentDom, matched, newChild, childPath);
        usedKeys.add(newChild.key);
        usedInstances.add(matched);
      }
    }

    // 2-2: Key로 매칭되지 않으면 인덱스로 매칭 (key가 없는 자식만)
    if (!childInstance) {
      // 순차적으로 매칭 시도
      while (renderedOldIndex < renderedOldChildren.length) {
        const oldChild = renderedOldChildren[renderedOldIndex];
        if (!oldChild || usedInstances.has(oldChild)) {
          renderedOldIndex++;
          continue;
        }
        // key가 있는 자식은 건너뛰기 (이미 key로 매칭 시도했음)
        if (oldChild.key !== null) {
          renderedOldIndex++;
          continue;
        }
        // 타입이 같으면 매칭
        if (oldChild.node.type === newChild.type) {
          childInstance = reconcile(parentDom, oldChild, newChild, childPath);
          usedInstances.add(oldChild);
          renderedOldIndex++;
          break;
        }
        renderedOldIndex++;
      }

      // 순차 매칭 실패 시, 마지막 자식인 경우 역순으로 타입 기반 매칭 시도
      // (Footer처럼 항상 마지막에 위치하는 컴포넌트를 위해)
      if (!childInstance && i === newChildren.length - 1) {
        for (let k = renderedOldChildren.length - 1; k >= 0; k--) {
          const oldChild = renderedOldChildren[k];
          if (!oldChild || usedInstances.has(oldChild)) continue;
          if (oldChild.key !== null) continue;
          if (oldChild.node.type === newChild.type) {
            childInstance = reconcile(parentDom, oldChild, newChild, childPath);
            usedInstances.add(oldChild);
            break;
          }
        }
      }
    }

    // 2-3: 매칭되지 않으면 새로 마운트
    // 새로 마운트된 자식은 일단 마지막에 추가하고, 나중에 위치를 조정
    if (!childInstance) {
      // Fragment의 경우 parentDom에 직접 추가하지 않고, 나중에 위치 조정
      // 하지만 mount 함수는 항상 parentDom에 추가하므로, 여기서는 그대로 호출
      childInstance = mount(parentDom, newChild, childPath);
    }

    childInstances.push(childInstance);
  }

  // 3단계: 순서가 변경된 자식들을 올바른 위치로 이동
  // 역순으로 처리하여 DOM 이동을 최소화 (명세서: 역순 순회와 anchor)
  for (let i = childInstances.length - 1; i >= 0; i--) {
    const childInstance = childInstances[i];
    if (!childInstance) continue;

    const newChild = newChildren[i];
    if (isEmptyValue(newChild)) continue;

    const oldIndex = oldIndexMap.get(childInstance);
    const isNewlyMounted = oldIndex === undefined;
    const needsMove = isNewlyMounted || (oldIndex !== undefined && oldIndex !== i);

    if (!needsMove) continue;

    // 다음 실제 렌더링된 자식의 DOM을 찾아서 그 앞에 삽입 (anchor)
    // 역순으로 처리하므로, 이미 처리된 자식들의 DOM은 올바른 위치에 있음
    let nextSibling: HTMLElement | Text | null = null;
    for (let j = i + 1; j < newChildren.length; j++) {
      const nextChild = newChildren[j];
      if (!isEmptyValue(nextChild) && j < childInstances.length) {
        const inst = childInstances[j];
        if (inst) {
          const dom = getFirstDom(inst);
          if (dom && dom.parentNode === parentDom) {
            nextSibling = dom as HTMLElement | Text;
            break;
          }
        }
      }
    }

    // DOM을 올바른 위치로 이동
    const firstDom = getFirstDom(childInstance);
    if (firstDom) {
      const currentParent = firstDom.parentNode;
      const currentNextSibling = firstDom.nextSibling;

      // 새로 마운트된 자식이거나 위치가 변경된 경우
      if (isNewlyMounted || currentParent !== parentDom || currentNextSibling !== nextSibling) {
        // 기존 위치에서 제거 (이미 parentDom에 있는 경우만)
        if (currentParent === parentDom) {
          // 모든 DOM 노드를 제거
          const nodes = getDomNodes(childInstance);
          for (const node of nodes) {
            if (node.parentNode === parentDom) {
              parentDom.removeChild(node);
            }
          }
        }
        // 올바른 위치에 삽입
        insertInstance(parentDom, childInstance, nextSibling);
      }
    } else {
      // DOM이 없으면 새로 삽입 (Fragment나 컴포넌트의 경우)
      insertInstance(parentDom, childInstance, nextSibling);
    }
  }

  // 4단계: 사용되지 않은 기존 자식 제거
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    if (!oldChild) continue;

    if (oldChild.key !== null && !usedKeys.has(oldChild.key)) {
      removeInstance(parentDom, oldChild);
    } else if (oldChild.key === null && !usedInstances.has(oldChild)) {
      removeInstance(parentDom, oldChild);
    }
  }

  instance.children = childInstances;
};
