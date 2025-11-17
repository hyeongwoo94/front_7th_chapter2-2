# 단계 4: 렌더 스케줄링

## 📋 개요

이 단계에서는 React의 렌더링을 비동기로 스케줄링하는 시스템을 구현합니다. 마이크로태스크 큐를 사용하여 여러 상태 업데이트를 배치 처리하고, 중복 렌더링을 방지합니다.

## 🎯 학습 목표

- 비동기 렌더링 스케줄링 메커니즘 이해
- 마이크로태스크 큐를 통한 작업 배치 처리 이해
- 중복 실행 방지 패턴 이해
- 렌더링 사이클의 전체 흐름 이해

## 📁 구현 파일

### 1. `packages/react/src/utils/enqueue.ts`
작업 큐 및 스케줄링 유틸리티

#### 구현 항목

##### `enqueue(func)`
- **목적**: 함수를 마이크로태스크 큐에 추가
- **파라미터**: 실행할 함수

**구현 요구사항**:
1. `queueMicrotask` 또는 `Promise.resolve().then()` 사용
2. 비동기로 함수 실행 예약
3. 동기 코드 실행 후 실행됨

**예시**:
```typescript
enqueue(() => console.log('async'));
console.log('sync');
// 출력: sync, async
```

##### `withEnqueue(func)`
- **목적**: 중복 실행 방지 고차 함수
- **파라미터**: 원본 함수
- **반환**: 래핑된 함수

**구현 요구사항**:
1. `scheduled` 플래그로 중복 실행 방지
2. 첫 호출 시 `scheduled = true` 설정
3. `enqueue`로 원본 함수 실행 예약
4. 실행 후 `scheduled = false`로 리셋
5. 이미 스케줄링된 경우 무시

**예시**:
```typescript
const scheduledFunc = withEnqueue(() => {
  console.log('rendered');
});

scheduledFunc(); // 스케줄링
scheduledFunc(); // 무시
scheduledFunc(); // 무시
// 실제로는 한 번만 실행됨
```

---

### 2. `packages/react/src/core/render.ts`
렌더링 함수

#### 구현 항목

##### `render()`
- **목적**: 루트 렌더링 수행
- **파라미터**: 없음 (전역 context 사용)

**구현 요구사항**:
1. 훅 컨텍스트 초기화:
   - `visited` Set 초기화
   - `componentStack` 초기화
2. `reconcile` 호출:
   - `context.root.container`
   - `context.root.node`
   - `context.root.instance`
   - 반환값을 `context.root.instance`에 저장
3. 미사용 훅 정리:
   - `cleanupUnusedHooks()` 호출 (다음 단계에서 구현)
4. 이펙트 실행:
   - `flushEffects()` 호출 (다음 단계에서 구현)

**플로우**:
```
render()
  → visited 초기화
  → componentStack 초기화
  → reconcile(...)
  → cleanupUnusedHooks()
  → flushEffects()
```

##### `enqueueRender()`
- **목적**: 렌더링을 스케줄링
- **파라미터**: 없음

**구현 요구사항**:
1. `withEnqueue`로 `render` 함수 래핑
2. 중복 렌더링 방지
3. 비동기로 렌더링 실행

**사용 예**:
```typescript
// useState setter에서 호출
setState(newValue); // enqueueRender() 호출
setState(anotherValue); // 무시됨 (이미 스케줄링됨)
// 실제로는 한 번만 렌더링
```

---

## ✅ 체크리스트

- [ ] `enqueue`: 마이크로태스크 큐에 함수 추가 구현
- [ ] `withEnqueue`: 중복 실행 방지 로직 구현
- [ ] `withEnqueue`: scheduled 플래그 관리 구현
- [ ] `render`: 훅 컨텍스트 초기화 구현
- [ ] `render`: reconcile 호출 구현
- [ ] `render`: cleanupUnusedHooks 호출 구현
- [ ] `render`: flushEffects 호출 구현
- [ ] `enqueueRender`: withEnqueue로 render 래핑 구현

---

## 🧪 테스트 확인

이 단계의 함수들은 다음 단계와 함께 테스트됩니다.

직접 확인할 수 있는 항목:
- `enqueue`가 비동기로 실행되는지
- `withEnqueue`가 중복 실행을 방지하는지
- `enqueueRender`가 배치 처리를 하는지

**테스트 예시**:
```typescript
let count = 0;
const func = withEnqueue(() => count++);

func();
func();
func();
// count는 1이 되어야 함
```

---

## 📚 참고 사항

### 마이크로태스크 큐
- `queueMicrotask()` 또는 `Promise.resolve().then()`
- 이벤트 루프에서 동기 코드 후, 렌더링 전 실행
- 여러 마이크로태스크는 큐 순서대로 실행

### 배치 처리 (Batching)
- 여러 상태 업데이트를 한 번의 렌더링으로 처리
- React의 성능 최적화 핵심
- 예: `setState(a)`, `setState(b)` → 한 번만 렌더링

### 렌더링 사이클
```
상태 변경 (setState)
  → enqueueRender()
  → (비동기) render()
    → reconcile()
    → cleanupUnusedHooks()
    → flushEffects()
```

### scheduled 플래그
```typescript
let scheduled = false;

function withEnqueue(func) {
  return () => {
    if (scheduled) return;
    scheduled = true;
    enqueue(() => {
      scheduled = false;
      func();
    });
  };
}
```

---

## ⚠️ 주의사항

1. **비동기 실행**: `enqueue`는 항상 비동기로 실행됨 (동기 실행 금지)
2. **플래그 리셋**: `scheduled` 플래그는 실행 후 반드시 리셋
3. **컨텍스트 접근**: `render`는 전역 `context`에 접근
4. **에러 처리**: 렌더링 중 에러 발생 시에도 플래그 리셋 (try-finally 권장)

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 5: Reconciliation](./step-05-reconciliation.md)

