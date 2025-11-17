import { context, enterComponent, exitComponent } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import {
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
  // context를 사용하여 루트 컨테이너 정보 확인
  const container = context.root.container || parentDom;
  return update(instance, node, container as HTMLElement, path);
};

/**
 * 새로운 VNode를 DOM으로 생성합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  // TEXT_ELEMENT 처리
  if (node.type === TEXT_ELEMENT) {
    const textNode = document.createTextNode(node.props.nodeValue || "");
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
    const children = (node.props.children || []) as VNode[];
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
  setDomProps(dom as HTMLElement, node.props);

  const children = (node.props.children || []) as VNode[];
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
    const childNode = Component(node.props);
    if (childNode === null) {
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
      (oldInstance.dom as Text).nodeValue = newNode.props.nodeValue || "";
    }
    oldInstance.node = newNode;
    return oldInstance;
  }

  // Fragment 처리
  if (oldInstance.kind === NodeTypes.FRAGMENT && newNode.type === Fragment) {
    reconcileChildren(parentDom, oldInstance, (newNode.props.children || []) as VNode[], path);
    oldInstance.dom = getFirstDomFromChildren(oldInstance.children);
    oldInstance.node = newNode;
    return oldInstance;
  }

  // 컴포넌트 처리
  if (oldInstance.kind === NodeTypes.COMPONENT) {
    return updateComponent(oldInstance, newNode, parentDom);
  }

  // DOM 요소 처리
  if (oldInstance.dom) {
    updateDomProps(oldInstance.dom as HTMLElement, oldInstance.node.props, newNode.props);
  }

  const domForChildren = (oldInstance.dom as HTMLElement) || parentDom;
  reconcileChildren(domForChildren, oldInstance, (newNode.props.children || []) as VNode[], path);

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
    const childNode = Component(newNode.props);
    if (childNode === null) {
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
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  instance: Instance,
  newChildren: VNode[],
  parentPath: string,
): void => {
  const oldChildren = instance.children || [];
  const childInstances: (Instance | null)[] = [];

  // Key 기반 Map 생성
  const keyMap = new Map<string | number, Instance>();
  for (const oldChild of oldChildren) {
    if (oldChild && oldChild.key !== null) {
      keyMap.set(oldChild.key, oldChild);
    }
  }

  const usedKeys = new Set<string | number>();

  // 새 자식 처리
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    if (isEmptyValue(newChild)) {
      childInstances.push(null);
      continue;
    }

    const childPath = createChildPath(parentPath, newChild.key, i, newChild.type, newChildren);
    let childInstance: Instance | null = null;
    let needsInsertion = false;

    // Key로 매칭
    if (newChild.key !== null && keyMap.has(newChild.key)) {
      const matched = keyMap.get(newChild.key)!;
      if (matched.node.type === newChild.type) {
        childInstance = reconcile(parentDom, matched, newChild, childPath);
        usedKeys.add(newChild.key);
        // 순서가 변경되었는지 확인
        const oldIndex = oldChildren.indexOf(matched);
        if (oldIndex !== i) {
          needsInsertion = true;
        }
      }
    }

    // Key로 매칭되지 않으면 인덱스로 매칭
    if (!childInstance && i < oldChildren.length) {
      const oldChild = oldChildren[i];
      if (oldChild && oldChild.node.type === newChild.type && oldChild.key === null) {
        childInstance = reconcile(parentDom, oldChild, newChild, childPath);
      }
    }

    // 매칭되지 않으면 새로 마운트
    if (!childInstance) {
      childInstance = mount(parentDom, newChild, childPath);
      needsInsertion = true;
    }

    // 순서가 변경되었거나 새로 마운트된 경우 올바른 위치에 삽입
    if (needsInsertion && childInstance) {
      const nextSibling = i < newChildren.length - 1 ? getFirstDom(childInstances[i + 1] || null) : null;
      if (nextSibling) {
        // 기존 DOM에서 제거 후 올바른 위치에 삽입
        const firstDom = getFirstDom(childInstance);
        if (firstDom && firstDom.parentNode === parentDom) {
          parentDom.removeChild(firstDom);
        }
        insertInstance(parentDom, childInstance, nextSibling as HTMLElement | Text);
      }
    }

    childInstances.push(childInstance);
  }

  // 사용되지 않은 기존 자식 제거
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    if (!oldChild) continue;

    if (oldChild.key !== null && !usedKeys.has(oldChild.key)) {
      removeInstance(parentDom, oldChild);
    } else if (oldChild.key === null && i >= newChildren.length) {
      removeInstance(parentDom, oldChild);
    }
  }

  instance.children = childInstances;
};
