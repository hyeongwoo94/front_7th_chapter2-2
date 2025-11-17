# 단계 1: VNode와 기초 유틸리티

## 📋 개요

이 단계에서는 React의 Virtual DOM의 기초가 되는 VNode 구조와 핵심 유틸리티 함수들을 구현합니다. JSX를 VNode로 변환하고, 값 비교를 위한 유틸리티 함수들을 제공합니다.

## 🎯 학습 목표

- Virtual DOM의 기본 구조 이해
- JSX를 VNode로 변환하는 과정 이해
- 값 비교 함수의 구현 원리 이해
- 컴포넌트 경로 생성 메커니즘 이해

## 📁 구현 파일

### 1. `packages/react/src/core/constants.ts`

심볼 상수 정의

#### 구현 항목

- `TEXT_ELEMENT`: 텍스트 노드를 식별하는 심볼
- `Fragment`: Fragment 컴포넌트를 식별하는 심볼
- `NodeTypes`: 노드 타입을 구분하는 상수 (선택사항)
- `HookTypes`: 훅 타입을 구분하는 상수 (선택사항)

#### 구현 가이드

```typescript
// 텍스트 노드 심볼
export const TEXT_ELEMENT = Symbol.for("react.text");

// Fragment 심볼
export const Fragment = Symbol.for("react.fragment");
```

---

### 2. `packages/react/src/core/elements.ts`

JSX를 VNode로 변환하는 함수

#### 구현 항목

##### `createElement(type, props, ...children)`

- **목적**: JSX를 VNode 객체로 변환
- **파라미터**:
  - `type`: 컴포넌트 타입 (문자열, 심볼, 함수)
  - `props`: 속성 객체 (null 가능)
  - `...children`: 자식 요소들 (배열)
- **반환**: VNode 객체

**구현 요구사항**:

1. children을 배열로 정규화
2. null, undefined, boolean 값 필터링 (`isEmptyValue` 사용)
3. props에 children 포함 (children이 있는 경우)
4. VNode 구조: `{ type, props, key }`

##### `normalizeNode(node)`

- **목적**: 원시 타입(문자열, 숫자)을 VNode로 변환
- **파라미터**: 원시 값 또는 VNode
- **반환**: VNode 객체

**구현 요구사항**:

1. 문자열/숫자는 `TEXT_ELEMENT` 타입 VNode로 변환
2. 이미 VNode면 그대로 반환
3. null, undefined, boolean은 null 반환

##### `createChildPath(parentPath, index, key)`

- **목적**: 컴포넌트의 고유 경로 생성 (훅 상태 격리용)
- **파라미터**:
  - `parentPath`: 부모 경로
  - `index`: 형제 요소 중 인덱스
  - `key`: React key (선택사항)
- **반환**: 경로 문자열 (예: "0.c0.i1.c2")

**구현 요구사항**:

1. key가 있으면 key 사용, 없으면 index 사용
2. 경로 형식: 부모경로 + "." + "c" + index 또는 "i" + key
3. 첫 번째 자식은 "0"에서 시작

---

### 3. `packages/react/src/utils/validators.ts`

값 검증 유틸리티

#### 구현 항목

##### `isEmptyValue(value)`

- **목적**: 렌더링 대상이 아닌 값 필터링
- **파라미터**: 검사할 값
- **반환**: boolean (빈 값이면 true)

**구현 요구사항**:

1. null 반환 true
2. undefined 반환 true
3. boolean 반환 true
4. 나머지는 false

---

### 4. `packages/react/src/utils/equals.ts`

값 비교 유틸리티

#### 구현 항목

##### `shallowEquals(a, b)`

- **목적**: 얕은 비교 (1단계 깊이만 비교)
- **파라미터**: 비교할 두 값
- **반환**: boolean

**구현 요구사항**:

1. `Object.is()`로 참조 동일성 검사
2. null/undefined 체크
3. 타입이 다르면 false
4. 객체/배열: 키 개수 비교 후 각 키 값 비교 (1단계만)
5. 중첩 객체는 참조만 비교

##### `deepEquals(a, b)`

- **목적**: 깊은 비교 (재귀적 비교)
- **파라미터**: 비교할 두 값
- **반환**: boolean

**구현 요구사항**:

1. `Object.is()`로 참조 동일성 검사
2. 타입이 다르면 false
3. 원시 타입은 `Object.is()`로 비교
4. 배열/객체: 재귀적으로 모든 속성 비교
5. 순환 참조 방지 (WeakSet 사용 권장)

---

## ✅ 체크리스트

- [ ] `TEXT_ELEMENT`, `Fragment` 심볼 정의 완료
- [ ] `createElement`: JSX → VNode 변환 구현
- [ ] `createElement`: children 정규화 및 필터링 구현
- [ ] `normalizeNode`: 원시 타입 → VNode 변환 구현
- [ ] `createChildPath`: 경로 생성 로직 구현
- [ ] `isEmptyValue`: 빈 값 필터링 구현
- [ ] `shallowEquals`: 얕은 비교 구현
- [ ] `deepEquals`: 깊은 비교 구현
- [ ] 모든 함수에 대한 타입 정의 완료

---

## 🧪 테스트 확인

이 단계가 완료되면 다음 테스트가 통과해야 합니다:

```bash
npm test basic.equals.test.tsx
```

테스트 항목:

- `shallowEquals` 테스트
- `deepEquals` 테스트
- `isEmptyValue` 테스트
- `createElement` 기본 기능 테스트

---

## 📚 참고 사항

### VNode 구조

```typescript
type VNode = {
  type: string | symbol | ComponentType;
  props: {
    children?: VNode[];
    [key: string]: any;
  };
  key?: string | number;
};
```

### 경로(Path) 형식

- 루트: `"0"`
- 첫 번째 자식: `"0.c0"`, `"0.i0"` (key 있음)
- 중첩된 자식: `"0.c0.i1.c2"`
- 경로는 훅 상태를 격리하는 데 사용됨

### 비교 함수 사용 예

```typescript
// 얕은 비교: props 변경 감지에 사용
shallowEquals(prevProps, nextProps); // useState deps 비교

// 깊은 비교: 중첩 객체 비교에 사용
deepEquals(prevState, nextState); // useDeepMemo에서 사용
```

---

## ⚠️ 주의사항

1. **children 정규화**: 항상 배열로 변환하고 빈 값 제거
2. **경로 생성**: key가 있으면 반드시 key 우선 사용
3. **비교 함수**: `Object.is()` 사용으로 NaN, +0/-0 케이스 처리
4. **순환 참조**: `deepEquals`에서 무한 루프 방지 필수

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 2: 컨텍스트와 루트 초기화](./step-02-context-root.md)
