# 단계 5: Reconciliation

## 📋 개요

이 단계에서는 React의 핵심 알고리즘인 Reconciliation을 구현합니다. 이전 Virtual DOM과 새로운 Virtual DOM을 비교하여 최소한의 DOM 변경만 수행하는 효율적인 업데이트 시스템을 구축합니다.

## 🎯 학습 목표

- Reconciliation 알고리즘의 동작 원리 이해
- 마운트/업데이트/언마운트 프로세스 이해
- Key 기반 자식 노드 최적화 이해
- 컴포넌트와 DOM 요소의 렌더링 차이 이해

## 📁 구현 파일

### `packages/react/src/core/reconciler.ts`
Reconciliation 알고리즘

#### 구현 항목

##### `reconcile(container, newNode, oldInstance)`
- **목적**: 이전 인스턴스와 새 VNode 비교 및 DOM 업데이트
- **파라미터**:
  - `container`: 부모 DOM 컨테이너
  - `newNode`: 새로운 VNode (null 가능)
  - `oldInstance`: 이전 Instance (null 가능)
- **반환**: Instance | null

**구현 요구사항**:
1. **null 처리**:
   - `newNode`가 null이면 `oldInstance` 언마운트 후 null 반환
2. **타입/키 비교**:
   - `oldInstance`가 null이면 `mount` 호출
   - 타입이 다르면 언마운트 후 마운트
   - key가 있고 다르면 언마운트 후 마운트
3. **업데이트**:
   - 타입과 key가 같으면 `update` 호출

---

##### `mount(container, node, anchor)`
- **목적**: 새로운 VNode를 DOM으로 생성
- **파라미터**:
  - `container`: 부모 DOM 컨테이너
  - `node`: 마운트할 VNode
  - `anchor`: 삽입 위치 기준점 (선택사항)
- **반환**: Instance

**구현 요구사항**:
1. **TEXT_ELEMENT 처리**:
   - `Text` 노드 생성
   - `nodeValue` 설정
   - `appendChild` 또는 `insertBefore`로 삽입
   - Instance 반환

2. **Fragment 처리**:
   - DOM 노드는 생성하지 않음
   - 자식들을 재귀적으로 마운트
   - 첫 번째 자식의 DOM을 참조로 사용
   - Instance 반환

3. **컴포넌트 처리**:
   - `mountComponent` 호출

4. **DOM 요소 처리**:
   - `createElement(node.type)`로 DOM 생성
   - `setDomProps`로 속성 설정
   - 자식들을 재귀적으로 마운트
   - `appendChild` 또는 `insertBefore`로 삽입
   - Instance 반환

---

##### `mountComponent(container, node, anchor)`
- **목적**: 함수 컴포넌트 마운트
- **파라미터**: `mount`와 동일
- **반환**: Instance

**구현 요구사항**:
1. **경로 생성**:
   - `createChildPath`로 컴포넌트 경로 생성
2. **훅 컨텍스트 설정**:
   - `enterComponent(path)` 호출
   - `try-finally`로 보장
3. **컴포넌트 실행**:
   - `node.type(props)` 호출
   - 반환된 VNode를 `childNode`로 저장
4. **자식 마운트**:
   - `mount(container, childNode, anchor)` 호출
   - 반환된 Instance를 `childInstance`로 저장
5. **Instance 생성**:
   - 컴포넌트 타입 Instance 생성
   - `path`, `childInstance` 저장
   - `dom`은 `getFirstDom(childInstance)` 사용
6. **정리**:
   - `finally`에서 `exitComponent()` 호출

---

##### `update(oldInstance, newNode)`
- **목적**: 기존 인스턴스 업데이트
- **파라미터**:
  - `oldInstance`: 이전 Instance
  - `newNode`: 새로운 VNode
- **반환**: Instance

**구현 요구사항**:
1. **TEXT_ELEMENT 처리**:
   - `nodeValue` 업데이트
   - `oldInstance` 반환 (DOM 재사용)

2. **Fragment 처리**:
   - 자식들을 `reconcileChildren`으로 업데이트
   - 첫 번째 DOM 참조 업데이트
   - `oldInstance` 업데이트 후 반환

3. **컴포넌트 처리**:
   - `updateComponent` 호출

4. **DOM 요소 처리**:
   - `updateDomProps`로 속성 업데이트
   - 자식들을 `reconcileChildren`으로 업데이트
   - `oldInstance` 업데이트 후 반환

---

##### `updateComponent(oldInstance, newNode)`
- **목적**: 함수 컴포넌트 업데이트
- **파라미터**: `update`와 동일
- **반환**: Instance

**구현 요구사항**:
1. **훅 컨텍스트 복원**:
   - `oldInstance.path`로 `enterComponent` 호출
   - `try-finally`로 보장
2. **컴포넌트 재실행**:
   - `newNode.type(newNode.props)` 호출
   - 반환된 VNode를 `childNode`로 저장
3. **자식 Reconciliation**:
   - `reconcile` 호출:
     - 컨테이너: `oldInstance.childInstance.dom`의 부모 또는 `container`
     - 새 노드: `childNode`
     - 이전 인스턴스: `oldInstance.childInstance`
4. **Instance 업데이트**:
   - `oldInstance.node = newNode`
   - `oldInstance.childInstance = 새 인스턴스`
   - `oldInstance.dom = getFirstDom(새 인스턴스)` 업데이트
5. **정리**:
   - `finally`에서 `exitComponent()` 호출

---

##### `reconcileChildren(parentDom, oldChildren, newChildren, anchor)`
- **목적**: 자식 노드 배열 비교 및 업데이트
- **파라미터**:
  - `parentDom`: 부모 DOM
  - `oldChildren`: 이전 자식 인스턴스 배열
  - `newChildren`: 새로운 자식 VNode 배열
  - `anchor`: 삽입 위치 기준점 (선택사항)

**구현 요구사항**:
1. **Key 기반 매칭**:
   - `oldChildren`에서 key별 Map 생성
   - key 없는 경우 인덱스 기반 매칭
2. **새 자식 처리**:
   - 각 `newChild`에 대해:
     - key로 매칭되는 `oldChild` 찾기
     - 있으면 `reconcile` 호출
     - 없으면 `mount` 호출
   - 새로운 인스턴스 배열 생성
3. **이동 처리**:
   - key로 매칭된 경우 위치 확인
   - 위치가 바뀌었으면 DOM 이동 (`insertBefore` 사용)
4. **제거 처리**:
   - `oldChildren`에서 사용되지 않은 인스턴스 찾기
   - 각각 `removeInstance`로 제거
5. **결과 반환**:
   - 새로운 인스턴스 배열 반환

---

##### `unmount(instance)`
- **목적**: 인스턴스 언마운트 및 정리
- **파라미터**: Instance

**구현 요구사항**:
1. **컴포넌트 처리**:
   - `childInstance`가 있으면 재귀적으로 언마운트
2. **자식 처리**:
   - `children`이 있으면 각각 언마운트
3. **DOM 제거**:
   - `parentDom`에서 `removeInstance` 호출
4. **정리**:
   - 이펙트 클린업 실행 (다음 단계에서 구현)

---

## ✅ 체크리스트

- [ ] `reconcile`: null 처리 구현
- [ ] `reconcile`: 타입/키 비교 구현
- [ ] `reconcile`: mount/update 분기 구현
- [ ] `mount`: TEXT_ELEMENT 처리 구현
- [ ] `mount`: Fragment 처리 구현
- [ ] `mount`: 컴포넌트 처리 구현
- [ ] `mount`: DOM 요소 처리 구현
- [ ] `mountComponent`: 경로 생성 및 훅 컨텍스트 설정 구현
- [ ] `mountComponent`: 컴포넌트 실행 및 자식 마운트 구현
- [ ] `update`: TEXT_ELEMENT 업데이트 구현
- [ ] `update`: Fragment 업데이트 구현
- [ ] `update`: 컴포넌트 업데이트 구현
- [ ] `update`: DOM 요소 업데이트 구현
- [ ] `updateComponent`: 훅 컨텍스트 복원 구현
- [ ] `updateComponent`: 컴포넌트 재실행 및 자식 reconcile 구현
- [ ] `reconcileChildren`: key 기반 매칭 구현
- [ ] `reconcileChildren`: 새 자식 처리 및 이동 구현
- [ ] `reconcileChildren`: 제거 처리 구현
- [ ] `unmount`: 인스턴스 언마운트 구현

---

## 🧪 테스트 확인

이 단계가 완료되면 다음 테스트가 통과해야 합니다:

```bash
npm test basic.mini-react.test.tsx
```

테스트 항목:
- 기본 렌더링 테스트
- 상태 변경 테스트
- 컴포넌트 업데이트 테스트
- 자식 노드 변경 테스트
- key 기반 최적화 테스트

---

## 📚 참고 사항

### Reconciliation 전략
1. **타입/키 비교**: 다른 타입이나 key면 완전 교체
2. **같은 타입**: 속성만 업데이트, 자식은 재귀 비교
3. **Key 우선**: key가 있으면 key로 매칭, 없으면 인덱스

### Instance 재사용
- 같은 타입/키면 DOM 재사용
- 속성만 업데이트하여 성능 최적화

### Fragment DOM 참조
- Fragment는 DOM 노드가 없음
- 첫 번째 자식의 DOM을 참조로 사용

### 컴포넌트 경로
- 마운트 시 경로 생성
- 업데이트 시 동일 경로 사용 (훅 상태 유지)

### 자식 배열 비교
```
기존: [A, B, C]
새로운: [A, C, B]
→ A는 그대로, C와 B는 DOM 이동만 수행
```

---

## ⚠️ 주의사항

1. **경로 유지**: 컴포넌트 업데이트 시 경로는 변경하지 않음
2. **DOM 이동**: key 기반 매칭 시 위치 변경 감지 필수
3. **anchor 사용**: 삽입 위치 제어 시 `anchor` 활용
4. **에러 처리**: 컴포넌트 실행 중 에러 발생 시에도 컨텍스트 정리
5. **DOM 참조**: Fragment와 컴포넌트는 `getFirstDom`으로 참조 가져오기

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 6: 기본 Hook 시스템](./step-06-basic-hooks.md)

