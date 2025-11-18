# Advanced 테스트 해결 명세서

## 📋 개요

`packages/react/src/__tests__/advanced.hooks.test.tsx`와 `advanced.hoc.test.tsx` 테스트를 통과시키기 위한 문제 해결 과정을 정리한 문서입니다.

## 🎯 테스트 범위

### 1. `advanced.hooks.test.tsx` (8개 테스트)
- `useRef` 훅 (2개 테스트)
- `useMemo` 훅 (1개 테스트)
- `useCallback` 훅 (2개 테스트)
- `useMemo` with custom equals (1개 테스트)
- `useDeepMemo` 훅 (1개 테스트)
- `useAutoCallback` 훅 (1개 테스트)

### 2. `advanced.hoc.test.tsx` (4개 테스트)
- `memo` HOC (4개 테스트)

## ❌ 발생한 문제

### 문제 1: useMemo 메모이제이션 실패
- **증상**: 같은 deps로 업데이트해도 factory가 2번 호출됨
- **예상**: `updateDeps!([42])` 후에도 factory가 1번만 호출되어야 함
- **실제**: factory가 2번 호출됨

### 문제 2: useCallback이 undefined 반환
- **증상**: `getMemoizedCallback!()`이 `undefined` 반환
- **예상**: 메모이제이션된 함수가 반환되어야 함

### 문제 3: useCallback 함수 동작 실패
- **증상**: `memoizedCallback is not a function` 에러
- **예상**: 반환된 값이 함수여야 함

### 문제 4: useMemo with custom equals 초기 렌더링 실패
- **증상**: factory가 0번 호출됨
- **예상**: 초기 렌더링에서 factory가 1번 호출되어야 함

### 문제 5: useDeepMemo 초기 렌더링 실패
- **증상**: factory가 0번 호출됨
- **예상**: 초기 렌더링에서 factory가 1번 호출되어야 함

### 문제 6: useAutoCallback 결과값 불일치
- **증상**: `[842, 84, 842]`가 나와야 하는데 `[2, 0, 2]`가 나와야 함
- **예상**: `count`가 1일 때 `callback1()`은 `2`, `callback2()`는 `0`, `callback3()`는 `2`를 반환해야 함

## 🔍 원인 분석

### 핵심 원인: 테스트 간 상태 초기화 누락

**문제의 핵심**:
- `setup` 함수가 각 테스트마다 호출되지만, `context.hooks.clear()`는 `state`와 `cursor`를 유지하도록 설계되어 있음
- 문서에 따르면 `state`와 `cursor`는 렌더링 간에 유지되어야 하지만, **테스트 간에는 초기화되어야 함**
- SPA 프로젝트에서 라우터가 상태를 관리하듯, 테스트 환경에서도 각 테스트마다 상태를 완전히 초기화해야 함

**영향**:
- 이전 테스트의 `useRef`, `useMemo`, `useCallback` 등의 상태가 다음 테스트에 영향을 미침
- `ref.current`가 이전 테스트의 값을 참조하여 의존성 비교가 잘못됨
- `useMemo`의 `ref.current.deps`가 이전 테스트의 배열을 참조하여 `shallowEquals` 비교가 실패함

## ✅ 해결 방법

### 수정 파일: `packages/react/src/core/setup.ts`

**수정 전**:
```typescript
// 4. 루트 컨텍스트와 훅 컨텍스트를 리셋합니다.
context.root.reset({ container, node: rootNode });
context.hooks.clear();
```

**수정 후**:
```typescript
// 4. 루트 컨텍스트와 훅 컨텍스트를 리셋합니다.
context.root.reset({ container, node: rootNode });
// 테스트 간 상태 초기화를 위해 state와 cursor도 초기화
context.hooks.state.clear();
context.hooks.cursor.clear();
context.hooks.clear();
```

### 수정 내용 설명

1. **`context.hooks.state.clear()`**: 모든 컴포넌트의 훅 상태를 초기화
   - `useRef`, `useMemo`, `useCallback` 등이 저장한 상태를 모두 제거
   - 각 테스트가 깨끗한 상태에서 시작하도록 보장

2. **`context.hooks.cursor.clear()`**: 모든 컴포넌트의 훅 커서를 초기화
   - 훅 호출 순서를 추적하는 커서를 0으로 리셋
   - 각 테스트가 올바른 커서 위치에서 시작하도록 보장

3. **`context.hooks.clear()`**: 기존 초기화 로직 유지
   - `visited`와 `componentStack` 초기화
   - 기존 동작 유지

## 📝 구현된 Hooks 상세

### 1. useRef (`packages/react/src/hooks/useRef.ts`)

```typescript
export const useRef = <T>(initialValue: T): { current: T } => {
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
};
```

**핵심 포인트**:
- `useState`를 사용하여 ref 객체를 한 번만 생성
- 함수형 초기값을 사용하여 초기화 시에만 실행
- `ref.current`를 직접 수정해도 재렌더링이 트리거되지 않음

### 2. useMemo (`packages/react/src/hooks/useMemo.ts`)

```typescript
export const useMemo = <T>(factory: () => T, deps?: DependencyList, equals = shallowEquals): T => {
  const ref = useRef<{ value: T; deps: DependencyList | undefined } | null>(null);

  if (!ref.current || !equals(ref.current.deps, deps)) {
    ref.current = { value: factory(), deps };
  }

  return ref.current.value;
};
```

**핵심 포인트**:
- `useRef`를 사용하여 이전 의존성 배열과 계산된 값을 저장
- `equals` 함수로 의존성을 비교하여 factory 함수를 재실행할지 결정
- 첫 렌더링이거나 의존성이 변경되었을 때만 factory 실행
- 커스텀 `equals` 함수를 사용할 수 있음

### 3. useCallback (`packages/react/src/hooks/useCallback.ts`)

```typescript
export const useCallback = <T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T => {
  return useMemo(() => callback, deps);
};
```

**핵심 포인트**:
- `useMemo`를 사용하여 함수를 메모이제이션
- 의존성 배열이 변경될 때만 함수를 재생성
- 간단한 구현으로 `useMemo`의 기능을 활용

### 4. useDeepMemo (`packages/react/src/hooks/useDeepMemo.ts`)

```typescript
export const useDeepMemo = <T>(factory: () => T, deps: DependencyList): T => {
  return useMemo(factory, deps, deepEquals);
};
```

**핵심 포인트**:
- `useMemo`와 `deepEquals`를 조합하여 깊은 비교 수행
- 객체나 배열의 중첩된 구조까지 비교하여 메모이제이션

### 5. useAutoCallback (`packages/react/src/hooks/useAutoCallback.ts`)

```typescript
export const useAutoCallback = <T extends AnyFunction>(fn: T): T => {
  const ref = useRef(fn);

  // 항상 최신 함수로 업데이트
  ref.current = fn;

  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
};
```

**핵심 포인트**:
- `useRef`로 최신 함수를 저장
- `useCallback`으로 안정적인 함수 참조 유지
- 함수 참조는 변경되지 않지만 항상 최신 함수를 호출

## 🧪 테스트 결과

### 최종 결과

```
✅ advanced.hooks.test.tsx: 8개 테스트 모두 통과
✅ advanced.hoc.test.tsx: 4개 테스트 모두 통과
```

### 테스트 상세

#### useRef 테스트
- ✅ 리렌더링이 되어도 useRef의 참조값이 유지된다
- ✅ 렌더링 간에 ref 값을 유지하고, 값 변경 시 리렌더링을 트리거하지 않아야 한다

#### useMemo 테스트
- ✅ useMemo 메모이제이션 테스트: 의존성의 값들이 변경될 때 재계산

#### useCallback 테스트
- ✅ useCallback 메모이제이션 테스트: 의존성의 값들이 변경될 때 재생성
- ✅ 메모이제이션된 콜백 함수가 올바르게 동작하는지 확인

#### useMemo with custom equals 테스트
- ✅ useMemo의 deps 비교 함수를 주입받아서 사용할 수 있다

#### useDeepMemo 테스트
- ✅ useDeepMemo를 사용할 경우, dependencies의 값에 대해 깊은비교를 하여 메모이제이션 한다

#### useAutoCallback 테스트
- ✅ useAutoCallback으로 만들어진 함수는, 참조가 변경되지 않으면서 항상 새로운 값을 참조한다

## 💡 핵심 교훈

### 1. 테스트 간 상태 격리의 중요성

**문제**: 테스트 간 상태가 공유되어 이전 테스트의 결과가 다음 테스트에 영향을 미침

**해결**: 각 테스트 시작 전에 모든 상태를 완전히 초기화

**교훈**: 
- SPA 프로젝트에서 라우터가 상태를 관리하듯, 테스트 환경에서도 각 테스트마다 상태를 완전히 초기화해야 함
- `setup` 함수는 테스트 간 격리를 보장하는 중요한 역할을 함

### 2. useRef의 동작 원리

**핵심**: `useRef`는 `useState`로 구현되어 있지만, `ref.current`를 직접 수정해도 재렌더링이 트리거되지 않음

**이유**: 
- `ref` 객체 자체는 `useState`로 생성되어 재렌더링 시에도 같은 참조를 유지
- `ref.current`를 직접 수정하면 `useState`의 상태가 업데이트되지 않지만, 객체의 속성을 변경하는 것이므로 다음 렌더링에서도 유지됨

### 3. 메모이제이션 패턴

**useMemo 동작**:
1. 첫 렌더링: `ref.current`가 `null`이므로 factory 실행
2. 두 번째 렌더링: `equals(ref.current.deps, deps)`로 비교
   - 같으면: factory 실행 안 함, 이전 값 반환
   - 다르면: factory 실행, 새 값 저장

**useCallback 동작**:
- `useMemo(() => callback, deps)`로 구현
- 함수를 메모이제이션하여 의존성이 변경될 때만 재생성

**useAutoCallback 동작**:
- `useRef`로 최신 함수 저장
- `useCallback`으로 안정적인 함수 참조 유지
- 함수 참조는 변경되지 않지만 항상 최신 함수를 호출

## 📚 참고 자료

### 관련 파일
- `packages/react/src/core/setup.ts`: 테스트 초기화 로직
- `packages/react/src/core/context.ts`: 훅 컨텍스트 관리
- `packages/react/src/hooks/useRef.ts`: useRef 구현
- `packages/react/src/hooks/useMemo.ts`: useMemo 구현
- `packages/react/src/hooks/useCallback.ts`: useCallback 구현
- `packages/react/src/hooks/useDeepMemo.ts`: useDeepMemo 구현
- `packages/react/src/hooks/useAutoCallback.ts`: useAutoCallback 구현
- `packages/react/src/__tests__/advanced.hooks.test.tsx`: hooks 테스트
- `packages/react/src/__tests__/advanced.hoc.test.tsx`: HOC 테스트

### 관련 문서
- `cursor/study/step7/작업_진행_과정.md`: step7 구현 과정
- `cursor/docs/step-07-advanced-hooks-hoc.md`: step7 구현 가이드

## 🎯 결론

**문제의 핵심**: 테스트 간 상태 초기화 누락

**해결 방법**: `setup` 함수에서 `context.hooks.state.clear()`와 `context.hooks.cursor.clear()`를 추가하여 테스트 간 상태를 완전히 초기화

**결과**: 모든 advanced 테스트 통과 (hooks 8개 + HOC 4개 = 총 12개)

**교훈**: 
- 테스트 코드를 작성하는 이유는 유지보수를 쉽게 하기 위함
- 테스트 간 상태 격리는 테스트의 신뢰성을 보장하는 핵심 요소
- SPA 프로젝트에서 라우터가 상태를 관리하듯, 테스트 환경에서도 각 테스트마다 상태를 완전히 초기화해야 함

