# 단계 7: 확장 Hook & HOC

## 📋 개요

이 단계에서는 React의 고급 기능인 확장 Hook과 HOC(Higher-Order Component)를 구현합니다. 메모이제이션을 통한 성능 최적화와 다양한 Hook 패턴을 제공합니다.

## 🎯 학습 목표

- 메모이제이션 패턴의 구현 원리 이해
- useRef를 통한 값 유지 메커니즘 이해
- useCallback과 useMemo의 차이점 이해
- HOC를 통한 컴포넌트 최적화 패턴 이해

## 📁 구현 파일

### 1. `packages/react/src/hooks/useRef.ts`
Ref Hook

#### 구현 항목

##### `useRef<T>(initialValue)`
- **목적**: 리렌더링 없이 값 유지
- **파라미터**: 초기값
- **반환**: `{ current: T }` 객체

**구현 요구사항**:
1. `useState`를 사용하여 ref 객체 생성
2. 첫 렌더링에만 초기값으로 객체 생성
3. 객체 참조는 항상 동일 (재렌더링해도 변경 안 됨)
4. `current` 속성 변경 시 재렌더링 트리거 안 됨

**구현 방식**:
```typescript
export function useRef<T>(initialValue: T) {
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
}
```

---

### 2. `packages/react/src/hooks/useMemo.ts`
Memoization Hook

#### 구현 항목

##### `useMemo<T>(factory, deps, equals?)`
- **목적**: 계산 결과 메모이제이션
- **파라미터**:
  - `factory`: 값을 계산하는 함수
  - `deps`: 의존성 배열
  - `equals`: 비교 함수 (선택사항, 기본값: `shallowEquals`)
- **반환**: 메모이제이션된 값

**구현 요구사항**:
1. `useRef`로 이전 값과 의존성 저장
2. 첫 렌더링이면 `factory()` 실행하여 값 계산
3. 의존성 비교 (`equals` 함수 사용)
4. 의존성이 변경되었으면 `factory()` 재실행
5. 변경 없으면 이전 값 반환

**구현 방식**:
```typescript
export function useMemo<T>(
  factory: () => T,
  deps: unknown[],
  equals: (a: unknown[], b: unknown[]) => boolean = shallowEquals
): T {
  const ref = useRef<{ value: T; deps: unknown[] } | null>(null);
  
  if (!ref.current || !equals(ref.current.deps, deps)) {
    ref.current = { value: factory(), deps };
  }
  
  return ref.current.value;
}
```

---

### 3. `packages/react/src/hooks/useCallback.ts`
Callback Memoization Hook

#### 구현 항목

##### `useCallback<T>(callback, deps)`
- **목적**: 함수 메모이제이션
- **파라미터**:
  - `callback`: 메모이제이션할 함수
  - `deps`: 의존성 배열
- **반환**: 메모이제이션된 함수

**구현 요구사항**:
1. `useMemo`를 사용하여 함수 메모이제이션
2. 의존성이 변경되지 않으면 동일한 함수 참조 반환

**구현 방식**:
```typescript
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: unknown[]
): T {
  return useMemo(() => callback, deps);
}
```

---

### 4. `packages/react/src/hooks/useDeepMemo.ts`
Deep Memoization Hook

#### 구현 항목

##### `useDeepMemo<T>(factory, deps)`
- **목적**: 깊은 비교 기반 메모이제이션
- **파라미터**:
  - `factory`: 값을 계산하는 함수
  - `deps`: 의존성 배열
- **반환**: 메모이제이션된 값

**구현 요구사항**:
1. `useMemo`에 `deepEquals`를 비교 함수로 전달
2. 의존성 배열의 모든 요소를 깊게 비교

**구현 방식**:
```typescript
export function useDeepMemo<T>(
  factory: () => T,
  deps: unknown[]
): T {
  return useMemo(factory, deps, deepEquals);
}
```

---

### 5. `packages/react/src/hooks/useAutoCallback.ts`
Auto Callback Hook

#### 구현 항목

##### `useAutoCallback<T>(callback)`
- **목적**: 최신 상태 참조하면서 참조 안정적인 콜백
- **파라미터**: 콜백 함수
- **반환**: 안정적인 참조의 콜백 함수

**구현 요구사항**:
1. `useRef`로 최신 콜백 참조 저장
2. `useCallback`으로 안정적인 함수 참조 생성
3. 생성된 함수는 ref를 통해 최신 콜백 호출
4. 의존성 배열은 빈 배열 (항상 같은 참조)

**구현 방식**:
```typescript
export function useAutoCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  // 항상 최신 콜백으로 업데이트
  callbackRef.current = callback;
  
  // 안정적인 함수 참조 반환
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}
```

---

### 6. `packages/react/src/hocs/memo.ts`
Memo HOC

#### 구현 항목

##### `memo<P>(Component)`
- **목적**: Props 얕은 비교 기반 컴포넌트 메모이제이션
- **파라미터**: 원본 컴포넌트
- **반환**: 메모이제이션된 컴포넌트

**구현 요구사항**:
1. 래퍼 컴포넌트 생성
2. `useRef`로 이전 props 저장
3. `shallowEquals`로 props 비교
4. props가 같으면 이전 결과 재사용
5. props가 다르면 컴포넌트 재실행

**구현 방식**:
```typescript
export function memo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const prevPropsRef = useRef<P | null>(null);
    const prevResultRef = useRef<VNode | null>(null);
    
    if (prevPropsRef.current && shallowEquals(prevPropsRef.current, props)) {
      return prevResultRef.current;
    }
    
    prevPropsRef.current = props;
    const result = Component(props);
    prevResultRef.current = result;
    
    return result;
  };
}
```

---

### 7. `packages/react/src/hocs/deepMemo.ts`
Deep Memo HOC

#### 구현 항목

##### `deepMemo<P>(Component)`
- **목적**: Props 깊은 비교 기반 컴포넌트 메모이제이션
- **파라미터**: 원본 컴포넌트
- **반환**: 메모이제이션된 컴포넌트

**구현 요구사항**:
1. `memo`와 동일한 구조
2. `deepEquals`를 비교 함수로 사용
3. 중첩된 객체도 깊게 비교

**구현 방식**:
```typescript
export function deepMemo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const prevPropsRef = useRef<P | null>(null);
    const prevResultRef = useRef<VNode | null>(null);
    
    if (prevPropsRef.current && deepEquals(prevPropsRef.current, props)) {
      return prevResultRef.current;
    }
    
    prevPropsRef.current = props;
    const result = Component(props);
    prevResultRef.current = result;
    
    return result;
  };
}
```

---

## ✅ 체크리스트

- [ ] `useRef`: ref 객체 생성 및 유지 구현
- [ ] `useMemo`: 의존성 비교 기반 메모이제이션 구현
- [ ] `useMemo`: 비교 함수 커스터마이징 지원 구현
- [ ] `useCallback`: 함수 메모이제이션 구현
- [ ] `useDeepMemo`: 깊은 비교 기반 메모이제이션 구현
- [ ] `useAutoCallback`: 최신 콜백 참조 + 안정적 참조 구현
- [ ] `memo`: props 얕은 비교 기반 HOC 구현
- [ ] `deepMemo`: props 깊은 비교 기반 HOC 구현

---

## 🧪 테스트 확인

이 단계가 완료되면 다음 테스트가 통과해야 합니다:

```bash
npm test advanced.hooks.test.tsx
npm test advanced.hoc.test.tsx
```

테스트 항목:
- `useRef` 기본 기능 테스트
- `useMemo` 의존성 변경 감지 테스트
- `useCallback` 함수 참조 안정성 테스트
- `useDeepMemo` 깊은 비교 테스트
- `useAutoCallback` 최신 상태 참조 테스트
- `memo` props 비교 테스트
- `deepMemo` 깊은 props 비교 테스트

---

## 📚 참고 사항

### useRef vs useState
- `useRef`: 값 변경 시 재렌더링 없음
- `useState`: 값 변경 시 재렌더링 트리거

### useMemo vs useCallback
- `useMemo`: 계산 결과 메모이제이션
- `useCallback`: 함수 참조 메모이제이션
- 내부적으로 `useCallback`은 `useMemo`로 구현 가능

### 얕은 비교 vs 깊은 비교
- **얕은 비교** (`shallowEquals`): 1단계 깊이만 비교
  - `{ a: { b: 1 } }`와 `{ a: { b: 1 } }`는 다름 (a 참조가 다름)
- **깊은 비교** (`deepEquals`): 모든 속성 재귀 비교
  - `{ a: { b: 1 } }`와 `{ a: { b: 1 } }`는 같음

### useAutoCallback 사용 시나리오
- 자식 컴포넌트에 콜백 전달 시
- 최신 상태를 참조해야 하지만 참조 안정성이 필요할 때
- 예: `onClick={() => setCount(count + 1)}` 대신 `useAutoCallback(() => setCount(count + 1))`

### HOC 메모이제이션
- 부모 컴포넌트가 재렌더링되어도 props가 같으면 자식 재렌더링 방지
- 성능 최적화에 유용

---

## ⚠️ 주의사항

1. **useRef 업데이트**: `ref.current` 변경 시 재렌더링 안 됨
2. **의존성 배열**: `useMemo`, `useCallback`은 의존성 배열 필수
3. **비교 함수**: `useMemo`의 `equals`는 의존성 배열을 비교하는 함수
4. **HOC 결과 저장**: `memo`와 `deepMemo`는 VNode를 저장하므로 인스턴스 재사용 주의
5. **순환 참조**: `deepEquals`에서 순환 참조 방지 필요

---

## 🎓 심화 과제 완료 기준

**완료 기준**: `advanced.hooks.test.tsx`, `advanced.hoc.test.tsx` 전부 통과

---

## 🔄 전체 프로젝트 완료

모든 단계를 완료하면 Mini-React의 핵심 기능을 구현한 것입니다! 🎉

다음을 수행할 수 있습니다:
- ✅ Virtual DOM 기반 렌더링
- ✅ Reconciliation 알고리즘
- ✅ useState, useEffect 등 기본 Hooks
- ✅ useRef, useMemo, useCallback 등 확장 Hooks
- ✅ memo, deepMemo 등 HOC 패턴

축하합니다! React의 내부 동작 원리를 깊이 이해하게 되었습니다.

