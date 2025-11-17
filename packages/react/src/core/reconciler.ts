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
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  instance: Instance,
  newChildren: VNode[],
  parentPath: string,
): void => {
  const oldChildren = instance.children || [];
  const childInstances: (Instance | null)[] = [];

  // Key 기반 Map 생성 (null이 아닌 자식만)
  const keyMap = new Map<string | number, Instance>();
  for (const oldChild of oldChildren) {
    if (oldChild && oldChild.key !== null) {
      keyMap.set(oldChild.key, oldChild);
    }
  }

  const usedKeys = new Set<string | number>();
  const usedInstances = new Set<Instance>();
  // 실제 렌더링된 oldChildren만 필터링
  const renderedOldChildren = oldChildren.filter((child) => child !== null);
  let renderedOldIndex = 0;

  // 새 자식 처리
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    // 조건부 렌더링으로 인한 null/false 처리
    if (isEmptyValue(newChild)) {
      childInstances.push(null);
      // key가 없는 기존 자식이 있으면 제거 (인덱스 매칭)
      while (renderedOldIndex < renderedOldChildren.length) {
        const oldChild = renderedOldChildren[renderedOldIndex];
        if (!oldChild) {
          renderedOldIndex++;
          continue;
        }
        // key가 있는 자식은 건너뛰기
        if (oldChild.key !== null) {
          renderedOldIndex++;
          continue;
        }
        // key가 없는 자식이면 제거
        removeInstance(parentDom, oldChild);
        renderedOldIndex++;
        break;
      }
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
        usedInstances.add(matched);
        // 순서가 변경되었는지 확인
        const matchedIndex = renderedOldChildren.indexOf(matched);
        const currentRenderedIndex = renderedOldChildren.findIndex(
          (c, idx) => idx >= renderedOldIndex && c && c.key === null && !usedInstances.has(c),
        );
        if (matchedIndex !== currentRenderedIndex && matchedIndex >= 0) {
          needsInsertion = true;
        }
      }
    }

    // Key로 매칭되지 않으면 인덱스로 매칭 (key가 없는 자식만)
    if (!childInstance) {
      while (renderedOldIndex < renderedOldChildren.length) {
        const oldChild = renderedOldChildren[renderedOldIndex];
        if (!oldChild) {
          renderedOldIndex++;
          continue;
        }
        // 이미 사용된 인스턴스는 건너뛰기
        if (usedInstances.has(oldChild)) {
          renderedOldIndex++;
          continue;
        }
        // key가 있는 자식은 건너뛰기
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
    }

    // 매칭되지 않으면 새로 마운트
    if (!childInstance) {
      childInstance = mount(parentDom, newChild, childPath);
      needsInsertion = true;
    }

    // 순서가 변경되었거나 새로 마운트된 경우 올바른 위치에 삽입
    if (needsInsertion && childInstance) {
      // 다음 실제 렌더링된 자식의 DOM을 찾아서 그 앞에 삽입
      let nextSibling: HTMLElement | Text | null = null;
      for (let j = i + 1; j < newChildren.length; j++) {
        const nextChild = newChildren[j];
        if (!isEmptyValue(nextChild)) {
          // childInstances에서 다음 실제 자식 찾기
          if (j < childInstances.length) {
            const inst = childInstances[j];
            if (inst) {
              nextSibling = getFirstDom(inst) as HTMLElement | Text | null;
              break;
            }
          }
          // 아직 처리되지 않았다면 기존 자식 중에서 찾기
          if (!nextSibling) {
            for (const oldChild of renderedOldChildren) {
              if (oldChild && oldChild.node === nextChild && !usedInstances.has(oldChild)) {
                nextSibling = getFirstDom(oldChild) as HTMLElement | Text | null;
                break;
              }
            }
          }
          break;
        }
      }

      if (nextSibling) {
        // 기존 DOM에서 제거 후 올바른 위치에 삽입
        const firstDom = getFirstDom(childInstance);
        if (firstDom && firstDom.parentNode === parentDom) {
          parentDom.removeChild(firstDom);
        }
        insertInstance(parentDom, childInstance, nextSibling);
      }
    }

    childInstances.push(childInstance);
  }

  // 사용되지 않은 기존 자식 제거
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    if (!oldChild) continue;

    // key가 있는 자식 중 사용되지 않은 것 제거
    if (oldChild.key !== null && !usedKeys.has(oldChild.key)) {
      removeInstance(parentDom, oldChild);
    }
    // key가 없는 자식 중 사용되지 않은 것 제거
    else if (oldChild.key === null && !usedInstances.has(oldChild)) {
      removeInstance(parentDom, oldChild);
    }
  }

  instance.children = childInstances;
};
