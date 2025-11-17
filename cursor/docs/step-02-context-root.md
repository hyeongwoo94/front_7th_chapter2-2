# 단계 2: 컨텍스트와 루트 초기화

## 📋 개요

이 단계에서는 React의 렌더링과 훅 시스템의 핵심인 컨텍스트 구조를 정의하고, 루트 렌더링을 시작하는 초기화 함수를 구현합니다. 각 컴포넌트의 훅 상태를 격리하고 관리하는 기반을 마련합니다.

## 🎯 학습 목표

- React의 컨텍스트 구조 이해
- 컴포넌트 경로 기반 상태 격리 메커니즘 이해
- 훅 커서와 컴포넌트 스택의 역할 이해
- 루트 렌더링 초기화 과정 이해

## 📁 구현 파일

### 1. `packages/react/src/core/types.ts`
핵심 타입 정의

#### 구현 항목

##### VNode 타입
```typescript
type VNode = {
  type: string | symbol | ComponentType;
  props: Record<string, any>;
  key?: string | number;
};
```

##### Instance 타입
```typescript
type Instance = {
  type: string | symbol | ComponentType;
  node: VNode;
  children?: Instance[];
  dom?: HTMLElement | Text;
  path?: string; // 컴포넌트 경로
  // 컴포넌트 타입일 때 추가 정보
  childInstance?: Instance;
};
```

##### Context 타입
```typescript
type Context = {
  root: {
    container: HTMLElement;
    node: VNode | null;
    instance: Instance | null;
  };
  hooks: {
    state: Map<string, any[]>; // 경로별 훅 상태 배열
    cursor: Map<string, number>; // 경로별 훅 커서
    visited: Set<string>; // 방문한 컴포넌트 경로
    componentStack: string[]; // 현재 실행 중인 컴포넌트 스택
  };
};
```

---

### 2. `packages/react/src/core/context.ts`
컨텍스트 관리 함수

#### 구현 항목

##### `createContext()`
- **목적**: 전역 컨텍스트 생성
- **반환**: Context 객체

**구현 요구사항**:
1. 루트 컨텍스트 초기화 (container, node, instance는 null)
2. 훅 컨텍스트 초기화 (Map, Set 초기화)

##### `context.hooks.currentPath`
- **목적**: 현재 컴포넌트의 경로 가져오기
- **반환**: string | null

**구현 요구사항**:
1. `componentStack`의 마지막 요소 반환
2. 스택이 비어있으면 null (훅 호출 위치 검증용)

##### `context.hooks.currentCursor`
- **목적**: 현재 컴포넌트의 훅 커서 가져오기
- **반환**: number

**구현 요구사항**:
1. `currentPath`로 경로 가져오기
2. `cursor Map`에서 해당 경로의 커서 조회 (없으면 0)

##### `context.hooks.currentHooks`
- **목적**: 현재 컴포넌트의 훅 상태 배열 가져오기
- **반환**: any[]

**구현 요구사항**:
1. `currentPath`로 경로 가져오기
2. `state Map`에서 해당 경로의 상태 배열 조회 (없으면 빈 배열)

##### `enterComponent(path)`
- **목적**: 컴포넌트 진입 (스택에 추가)
- **파라미터**: 컴포넌트 경로

**구현 요구사항**:
1. `componentStack`에 경로 추가
2. 커서 초기화 (새 컴포넌트이므로 0)

##### `exitComponent()`
- **목적**: 컴포넌트 종료 (스택에서 제거)
- **구현 요구사항**:
1. `componentStack`에서 마지막 요소 제거

##### `incrementCursor(path)`
- **목적**: 훅 커서 증가
- **파라미터**: 컴포넌트 경로

**구현 요구사항**:
1. 해당 경로의 커서를 1 증가
2. 없으면 1로 초기화

---

### 3. `packages/react/src/core/setup.ts`
루트 렌더링 초기화

#### 구현 항목

##### `setup(node, container)`
- **목적**: 루트 렌더링 시작점
- **파라미터**:
  - `node`: 루트 VNode
  - `container`: DOM 컨테이너

**구현 요구사항**:
1. 컨테이너 유효성 검사 (없으면 에러)
2. 컨텍스트 리셋:
   - `context.root.container = container`
   - `context.root.node = node`
   - `context.hooks` 초기화 (state, cursor, visited, componentStack)
3. 기존 인스턴스 가져오기 (컨테이너에서)
4. `reconcile` 호출하여 렌더링 시작 (다음 단계에서 구현)
5. 컨텍스트에 새 인스턴스 저장

---

### 4. `packages/react/src/client/index.ts`
React 18 스타일 API

#### 구현 항목

##### `createRoot(container)`
- **목적**: React 18 스타일의 루트 생성 API
- **파라미터**: DOM 컨테이너
- **반환**: `{ render(node) }` 객체

**구현 요구사항**:
1. `render` 메서드를 가진 객체 반환
2. `render`는 `setup`을 호출

---

## ✅ 체크리스트

- [ ] `VNode`, `Instance`, `Context` 타입 정의 완료
- [ ] `createContext`: 컨텍스트 생성 함수 구현
- [ ] `currentPath`: 컴포넌트 경로 조회 구현
- [ ] `currentCursor`: 훅 커서 조회 구현
- [ ] `currentHooks`: 훅 상태 배열 조회 구현
- [ ] `enterComponent`: 컴포넌트 진입 구현
- [ ] `exitComponent`: 컴포넌트 종료 구현
- [ ] `incrementCursor`: 커서 증가 구현
- [ ] `setup`: 루트 렌더링 초기화 구현
- [ ] `createRoot`: React 18 스타일 API 구현

---

## 🧪 테스트 확인

이 단계만으로는 독립적인 테스트가 없을 수 있습니다. 다음 단계들과 함께 테스트가 통과됩니다.

하지만 다음을 확인하세요:
- 컨텍스트가 올바르게 생성되는지
- `componentStack`이 올바르게 관리되는지
- `setup`이 컨테이너를 올바르게 초기화하는지

---

## 📚 참고 사항

### 컨텍스트 구조
```typescript
// 전역 컨텍스트 (모듈 레벨에서 관리)
const context: Context = createContext();
```

### 경로 기반 상태 격리
- 각 컴포넌트는 고유한 경로를 가짐
- 경로별로 훅 상태가 분리되어 저장됨
- 예: `"0"`, `"0.c0"`, `"0.c0.i1.c2"`

### 컴포넌트 스택
```typescript
// 컴포넌트 실행 시
componentStack = ["0", "0.c0", "0.c0.i1"]
// 현재 경로는 "0.c0.i1"

// 컴포넌트 종료 시
componentStack = ["0", "0.c0"]
```

### 훅 커서
- 각 컴포넌트마다 독립적인 커서를 가짐
- 훅 호출 순서를 추적하여 상태와 매칭
- 예: `useState()` 호출 시 cursor=0, `useEffect()` 호출 시 cursor=1

---

## ⚠️ 주의사항

1. **컨텍스트 초기화**: 매 렌더링마다 visited Set은 초기화하되, state와 cursor는 유지
2. **경로 격리**: 경로가 다르면 완전히 별개의 상태로 관리
3. **스택 관리**: enter/exit이 쌍으로 호출되도록 보장 (try-finally 사용 권장)
4. **에러 처리**: `currentPath`가 null이면 훅 호출 위치 에러 발생

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 3: DOM 인터페이스](./step-03-dom-interface.md)

