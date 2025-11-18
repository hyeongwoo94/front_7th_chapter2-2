# Reconciliation 로직 개선 명세서

## 개요

이 문서는 MiniReact의 `reconcileChildren` 함수와 관련 DOM 조작 로직의 개선 사항을 정리한 명세서입니다. 
명세서(01-implementation-guide.md, 03-fundamental-knowledge.md)의 알고리즘을 정확히 따르도록 재작성되었습니다.

## 해결한 문제들

### 1. Footer 상태 유지 문제
**문제**: 중첩된 컴포넌트에서 useState가 각각 독립적으로 동작해야 하는데, Footer 컴포넌트의 상태가 유지되지 않음

**원인**: Item 개수가 변경될 때 Footer가 항상 마지막에 위치하지만, 순차 매칭만으로는 매칭되지 않음

**해결**: 순차 매칭 실패 시, 마지막 자식인 경우 역순으로 타입 기반 매칭 시도
- `reconcileChildren` 함수의 2-2 단계에 역순 매칭 로직 추가
- Footer처럼 항상 마지막에 위치하는 컴포넌트의 상태를 보존

```typescript
// 순차 매칭 실패 시, 마지막 자식인 경우 역순으로 타입 기반 매칭 시도
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
```

### 2. Dynamic Fragment 문제
**문제**: 조건부 렌더링으로 Fragment에 새 자식이 추가될 때, 텍스트 노드가 제대로 처리되지 않음 (`<p id="dynamic"></p>`가 생성되지만 텍스트가 비어있음)

**원인**: `insertInstance` 함수가 `getDomNodes`를 사용하여 모든 DOM 노드를 개별적으로 삽입하려고 시도하면서, 이미 DOM에 있는 노드를 중복 처리하거나 children이 손실됨

**해결**: `insertInstance` 함수를 수정하여 일반 인스턴스는 첫 번째 DOM 노드만 삽입하도록 변경
- 일반 인스턴스: 첫 번째 DOM 노드만 삽입 (children은 자동으로 포함됨)
- Fragment 인스턴스: 모든 children의 DOM 노드를 순서대로 삽입

```typescript
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  if (!instance) return;

  // Fragment의 경우 모든 children의 DOM 노드를 순서대로 삽입
  if (instance.kind === NodeTypes.FRAGMENT) {
    if (instance.children) {
      for (const child of instance.children) {
        if (child) {
          insertInstance(parentDom, child, anchor);
          // 다음 children을 위한 anchor 업데이트
          const childFirstDom = getFirstDom(child);
          if (childFirstDom && childFirstDom.parentNode === parentDom) {
            const childNodes = getDomNodes(child);
            if (childNodes.length > 0) {
              const lastChildNode = childNodes[childNodes.length - 1];
              if (lastChildNode.parentNode === parentDom) {
                anchor = lastChildNode.nextSibling as HTMLElement | Text | null;
              }
            }
          }
        }
      }
    }
    return;
  }

  // 일반 인스턴스의 경우 첫 번째 DOM 노드만 처리 (children은 자동으로 포함됨)
  const firstDom = getFirstDom(instance);
  if (!firstDom) return;

  // 노드가 이미 올바른 위치에 있으면 건너뛰기
  if (firstDom.parentNode === parentDom && firstDom.nextSibling === anchor) {
    return;
  }

  // 노드가 이미 다른 위치에 있으면 insertBefore가 자동으로 이동시킴
  if (anchor) {
    parentDom.insertBefore(firstDom, anchor);
  } else {
    parentDom.appendChild(firstDom);
  }
};
```

### 3. Fragment 자식 제거 문제
**문제**: Fragment의 children이 빈 배열(`<></>`)로 변경될 때 기존 자식들이 제거되지 않음

**원인**: `isEmptyValue`로 필터링된 자식에 대해 기존 자식을 제거하는 로직이 복잡하고 제대로 작동하지 않음

**해결**: `isEmptyValue` 처리 로직을 단순화하고, 4단계에서 사용되지 않은 기존 자식을 제거하는 로직에 의존
- `isEmptyValue`인 경우 `childInstances.push(null)`만 하고 continue
- 4단계에서 `usedInstances`에 포함되지 않은 기존 자식을 모두 제거

```typescript
// 조건부 렌더링으로 인한 null/false 처리
if (isEmptyValue(newChild)) {
  childInstances.push(null);
  continue; // 4단계에서 제거됨
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
```

## reconcileChildren 알고리즘

명세서의 알고리즘을 정확히 따르도록 재작성되었습니다:

### 1단계: Key 기반 Map 생성 및 인덱스 추적
- `keyMap`: key가 있는 기존 자식들을 빠르게 찾기 위한 Map
- `oldIndexMap`: 각 인스턴스의 원래 인덱스를 추적하여 위치 변경 여부를 판단

### 2단계: 새 자식들을 순회하며 매칭 및 reconcile
- **2-1: Key로 매칭**: key가 있는 자식은 Map을 사용하여 빠르게 찾고 재사용
- **2-2: 인덱스로 매칭**: key가 없는 자식은 타입과 위치가 유사한 후보를 찾아 재사용
  - 순차적으로 매칭 시도
  - 순차 매칭 실패 시, 마지막 자식인 경우 역순으로 타입 기반 매칭 시도 (Footer 등)
- **2-3: 새로 마운트**: 매칭되지 않으면 새로 마운트

### 3단계: 순서가 변경된 자식들을 올바른 위치로 이동
- **역순 처리**: 뒤에서 앞으로 순회하면서 다음 삽입 위치(anchor)를 계산하여 DOM 이동을 최소화
- 새로 마운트된 자식도 올바른 위치에 삽입
- `nextSibling`을 찾아서 그 앞에 삽입 (anchor 기반)

### 4단계: 사용되지 않은 기존 자식 제거
- key가 있는 자식 중 사용되지 않은 것 제거
- key가 없는 자식 중 사용되지 않은 것 제거

## 주요 개선 사항

### 1. 역순 순회와 anchor 기반 삽입
명세서의 "역순 순회와 anchor" 알고리즘을 정확히 구현:
- 역순으로 처리하여 이미 처리된 자식들의 DOM은 올바른 위치에 있음
- `nextSibling`을 찾아서 그 앞에 삽입하여 순서 보장

### 2. Fragment 처리 개선
- Fragment의 모든 children을 순서대로 삽입하도록 `insertInstance` 수정
- 각 child 삽입 후 anchor를 업데이트하여 다음 child가 올바른 위치에 삽입되도록 함

### 3. 새로 마운트된 자식의 위치 조정
- 새로 마운트된 자식도 올바른 위치에 삽입되도록 3단계에서 처리
- 이미 DOM에 있는 노드를 제거하고 올바른 위치에 다시 삽입

## 테스트 결과

모든 basic 테스트(60개)가 통과했습니다:
- ✅ 중첩된 컴포넌트에서 useState가 각각 독립적으로 동작한다
- ✅ 중간에 새 자식을 삽입해도 기존 DOM을 유지한다
- ✅ Fragment를 사용한 동적 렌더링에서 올바른 DOM 구조를 유지해야 한다
- ✅ 기타 모든 reconciliation 관련 테스트

## 참고 자료

- `docs/01-implementation-guide.md`: 구현 가이드
- `docs/02-sequence-diagrams.md`: 시퀀스 다이어그램
- `docs/03-fundamental-knowledge.md`: 기본 지식 (리컨실리에이션과 자식 비교 전략)

## 파일 변경 사항

### packages/react/src/core/reconciler.ts
- `reconcileChildren` 함수를 처음부터 재작성
- 역순 매칭 로직 추가 (Footer 등 마지막 자식 처리)
- 역순 순회와 anchor 기반 삽입 로직 구현

### packages/react/src/core/dom.ts
- `insertInstance` 함수 수정
- Fragment의 모든 children을 순서대로 삽입하도록 개선
- 일반 인스턴스는 첫 번째 DOM 노드만 삽입 (children은 자동으로 포함)

## 결론

명세서의 알고리즘을 정확히 따르도록 `reconcileChildren` 로직을 재작성하고, Fragment 처리 및 DOM 삽입 로직을 개선하여 모든 테스트를 통과했습니다.

