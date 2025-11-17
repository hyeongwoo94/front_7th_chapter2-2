# 단계 6: 기본 Hook 시스템

## 📋 개요

이 단계에서는 React의 핵심 기능인 Hooks 시스템을 구현합니다. `useState`와 `useEffect`를 구현하여 컴포넌트 상태 관리와 사이드 이펙트 처리를 가능하게 합니다.

## 🎯 학습 목표

- Hook 시스템의 내부 동작 원리 이해
- 경로 기반 상태 격리 메커니즘 이해
- 훅 커서를 통한 호출 순서 추적 이해
- useEffect의 의존성 비교 및 클린업 처리 이해

## 📁 구현 파일

### `packages/react/src/core/hooks.ts`
기본 Hook 구현

#### 구현 항목

##### `useState<T>(initialValue)`
- **목적**: 컴포넌트 상태 관리
- **파라미터**:
  - `initialValue`: 초기값 (값 또는 함수)
- **반환**: `[state, setState]` 튜플

**구현 요구사항**:
1. **현재 경로 및 커서 가져오기**:
   - `context.hooks.currentPath`로 경로 조회
   - 경로가 null이면 에러 (훅은 컴포넌트 내부에서만 호출)
   - `context.hooks.currentCursor`로 커서 조회

2. **상태 조회**:
   - `context.hooks.currentHooks`로 현재 훅 상태 배열 가져오기
   - 현재 커서 위치의 상태 확인

3. **초기값 평가**:
   - 상태가 없으면 (첫 렌더링):
     - `initialValue`가 함수면 호출하여 초기값 계산
     - 아니면 `initialValue` 그대로 사용
     - 상태 배열에 저장

4. **현재 상태 가져오기**:
   - 저장된 상태 반환

5. **setter 함수 생성**:
   - `setState` 함수 생성:
     - `newValue`가 함수면 이전 값으로 호출
     - `Object.is()`로 값 비교
     - 값이 변경되었으면:
       - 상태 업데이트
       - `enqueueRender()` 호출 (재렌더링 스케줄링)
     - 변경 없으면 아무 작업 없음

6. **커서 증가**:
   - `incrementCursor(path)` 호출

7. **반환**:
   - `[state, setState]` 튜플 반환

**예시**:
```typescript
const [count, setCount] = useState(0);
const [user, setUser] = useState(() => ({ name: 'John' }));

setCount(1); // 재렌더링 트리거
setUser(prev => ({ ...prev, age: 20 })); // 함수형 업데이트
```

---

##### `useEffect(effect, deps)`
- **목적**: 사이드 이펙트 처리
- **파라미터**:
  - `effect`: 이펙트 함수 (반환값이 cleanup 함수일 수 있음)
  - `deps`: 의존성 배열 (선택사항)
- **반환**: void

**구현 요구사항**:
1. **현재 경로 및 커서 가져오기**:
   - `context.hooks.currentPath`로 경로 조회
   - `context.hooks.currentCursor`로 커서 조회

2. **이전 이펙트 훅 조회**:
   - `context.hooks.currentHooks`에서 현재 커서 위치의 훅 확인
   - 이전 이펙트와 의존성 배열 가져오기

3. **의존성 비교**:
   - 첫 렌더링이면 (`prevHook`이 없음) 실행
   - `deps`가 없으면 매 렌더링마다 실행
   - `deps`가 있으면 `shallowEquals`로 비교
   - 의존성이 변경되었으면 실행

4. **이전 클린업 실행**:
   - 이전 이펙트의 클린업 함수가 있으면 실행

5. **새 이펙트 스케줄링**:
   - 이펙트 실행이 필요하면:
     - `flushEffects`에 이펙트 추가 (다음에 구현)
     - 이펙트 실행 결과가 함수면 클린업으로 저장

6. **훅 정보 저장**:
   - 현재 이펙트와 의존성 배열을 훅 상태에 저장

7. **커서 증가**:
   - `incrementCursor(path)` 호출

**예시**:
```typescript
useEffect(() => {
  console.log('mounted');
  return () => console.log('unmounted');
}, []);

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

---

##### `cleanupUnusedHooks()`
- **목적**: 방문하지 않은 컴포넌트의 훅 정리
- **파라미터**: 없음

**구현 요구사항**:
1. **방문하지 않은 경로 찾기**:
   - `context.hooks.state`의 모든 경로 확인
   - `context.hooks.visited`에 없는 경로 찾기

2. **클린업 실행**:
   - 각 미사용 경로의 훅 상태 확인
   - `useEffect` 훅의 클린업 함수 실행

3. **상태 정리**:
   - 미사용 경로의 상태 및 커서 제거
   - `context.hooks.state.delete(path)`
   - `context.hooks.cursor.delete(path)`

**예시**:
```
렌더링 전: state = { "0": [...], "0.c0": [...] }
렌더링 후: visited = { "0", "0.c1" }
→ "0.c0"는 미사용이므로 정리
```

---

##### `flushEffects()`
- **목적**: 예약된 이펙트 실행
- **파라미터**: 없음

**구현 요구사항**:
1. **이펙트 큐 확인**:
   - 전역 이펙트 큐에 저장된 이펙트 확인
   - (다음 단계에서 이펙트 큐 구조 구현)

2. **이펙트 실행**:
   - 각 이펙트를 비동기로 실행 (`enqueue` 사용)
   - 실행 결과가 함수면 클린업으로 저장

3. **큐 초기화**:
   - 실행 후 큐 초기화

**구현 방식** (간단한 버전):
```typescript
// 전역 이펙트 큐
const effectQueue: Array<() => void | (() => void)> = [];

function flushEffects() {
  effectQueue.forEach(effect => {
    enqueue(() => {
      const cleanup = effect();
      // cleanup 저장 (컴포넌트별로 관리)
    });
  });
  effectQueue.length = 0;
}
```

---

## ✅ 체크리스트

- [ ] `useState`: 경로 및 커서 조회 구현
- [ ] `useState`: 초기값 평가 (함수형 지원) 구현
- [ ] `useState`: 상태 저장 및 조회 구현
- [ ] `useState`: setter 함수 생성 (함수형 업데이트 지원) 구현
- [ ] `useState`: Object.is로 값 비교 구현
- [ ] `useState`: 재렌더링 스케줄링 구현
- [ ] `useState`: 커서 증가 구현
- [ ] `useEffect`: 경로 및 커서 조회 구현
- [ ] `useEffect`: 의존성 비교 (shallowEquals) 구현
- [ ] `useEffect`: 이전 클린업 실행 구현
- [ ] `useEffect`: 새 이펙트 스케줄링 구현
- [ ] `useEffect`: 훅 정보 저장 구현
- [ ] `cleanupUnusedHooks`: 미사용 경로 찾기 구현
- [ ] `cleanupUnusedHooks`: 클린업 실행 및 상태 정리 구현
- [ ] `flushEffects`: 이펙트 큐 실행 구현

---

## 🧪 테스트 확인

이 단계가 완료되면 다음 테스트가 통과해야 합니다:

```bash
npm test basic.mini-react.test.tsx
```

테스트 항목:
- `useState` 기본 기능 테스트
- 상태 변경 및 재렌더링 테스트
- `useEffect` 기본 기능 테스트
- 의존성 배열 변경 감지 테스트
- 클린업 함수 실행 테스트
- 미사용 훅 정리 테스트

---

## 📚 참고 사항

### 훅 규칙
1. **컴포넌트 내부에서만 호출**: `currentPath`가 null이면 에러
2. **호출 순서 유지**: 조건문/반복문 안에서 훅 호출 금지
3. **경로 기반 격리**: 각 컴포넌트의 훅 상태는 경로로 완전히 격리

### 상태 저장 구조
```typescript
context.hooks.state = Map<
  "0",           // 경로
  [              // 훅 상태 배열
    { type: 'state', value: 0 },      // 첫 번째 useState
    { type: 'state', value: 'text' }, // 두 번째 useState
    { type: 'effect', deps: [...] }   // useEffect
  ]
>
```

### 커서 동작
```typescript
// 컴포넌트 렌더링 시
cursor = 0 → useState() 호출
cursor = 1 → useEffect() 호출
cursor = 2 → useState() 호출
// 다음 렌더링에서도 동일한 순서 보장
```

### 의존성 비교
- `deps` 없음: 매 렌더링마다 실행
- `deps = []`: 첫 렌더링만 실행
- `deps = [a, b]`: a 또는 b가 변경되면 실행
- 비교는 `shallowEquals` 사용

### 클린업 실행 시점
- 컴포넌트 언마운트 시
- 의존성 변경 시 (새 이펙트 실행 전)
- 미사용 훅 정리 시

---

## ⚠️ 주의사항

1. **커서 증가**: 훅 호출 후 반드시 커서 증가
2. **경로 검증**: `currentPath`가 null이면 명확한 에러 메시지
3. **상태 저장**: 상태는 경로와 커서로 고유하게 식별
4. **클린업 저장**: 이펙트의 클린업 함수는 경로+커서로 저장
5. **비동기 이펙트**: 이펙트는 렌더링 후 비동기 실행
6. **함수형 초기값**: `useState`의 초기값이 함수면 lazy evaluation

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 7: 확장 Hook & HOC](./step-07-advanced-hooks-hoc.md)

**기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과

