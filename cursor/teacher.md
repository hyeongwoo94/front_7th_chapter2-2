# React Hook 구현 에이전트 명세서

## 📋 프로젝트 개요

이 프로젝트는 **React의 핵심 기능을 직접 구현**하여 내부 동작 원리를 이해하는 것을 목표로 합니다. 특히 **React Hooks 시스템**을 포함한 Mini-React 구현체를 단계적으로 구축합니다.

### 프로젝트 목표

- Virtual DOM과 Reconciliation 알고리즘의 동작 원리 이해
- React Hooks의 내부 구현과 상태 관리 메커니즘 학습
- 컴포넌트 생명주기와 렌더링 최적화 기법 구현
- 메모이제이션과 HOC 패턴의 구현 원리 파악

---

## 🎯 구현해야 할 핵심 기능

### 1. 기본 과제 (단계 1-6)

#### 단계 1: VNode와 기초 유틸리티

- **파일**: `core/constants.ts`, `core/elements.ts`, `utils/validators.ts`, `utils/equals.ts`
- **기능**:
  - `TEXT_ELEMENT`, `Fragment` 심볼 정의
  - `isEmptyValue`: null, undefined, boolean 필터링
  - `shallowEquals`, `deepEquals`: 얕은/깊은 비교 함수
  - `createElement`: JSX를 VNode로 변환
  - `normalizeNode`: 다양한 타입의 노드를 VNode로 정규화
  - `createChildPath`: 컴포넌트 경로 생성 (훅 상태 격리용)

#### 단계 2: 컨텍스트와 루트 초기화

- **파일**: `core/types.ts`, `core/context.ts`, `core/setup.ts`, `client/index.ts`
- **기능**:
  - VNode, Instance, Context 타입 정의
  - 루트 컨텍스트: 컨테이너, 노드, 인스턴스 관리
  - 훅 컨텍스트: 상태 저장소, 커서, 방문 기록, 컴포넌트 스택
  - `setup`: 루트 렌더링 시작점
  - `createRoot`: React 18 스타일 API 노출

#### 단계 3: DOM 인터페이스

- **파일**: `core/dom.ts`
- **기능**:
  - `setDomProps`: DOM 속성 설정 (이벤트, 스타일, className 등)
  - `updateDomProps`: 속성 업데이트 (변경된 것만 효율적으로)
  - `getDomNodes`, `getFirstDom`: DOM 노드 탐색
  - `insertInstance`, `removeInstance`: DOM 삽입/제거

#### 단계 4: 렌더 스케줄링

- **파일**: `utils/enqueue.ts`, `core/render.ts`
- **기능**:
  - `enqueue`: 마이크로태스크 큐에 작업 추가
  - `withEnqueue`: 중복 실행 방지 고차 함수
  - `render`: 루트 컴포넌트 렌더링 수행
  - `enqueueRender`: 렌더링을 스케줄링

#### 단계 5: Reconciliation

- **파일**: `core/reconciler.ts`
- **기능**:
  - `reconcile`: 이전 인스턴스와 새 VNode 비교
  - `mount`: 새 노드 마운트 (텍스트, Fragment, 컴포넌트, DOM 요소)
  - `update`: 기존 노드 업데이트
  - 자식 노드 비교 및 최적화 (key 기반 매칭)

#### 단계 6: 기본 Hook 시스템

- **파일**: `core/hooks.ts`
- **기능**:
  - `useState`: 상태 관리 훅
    - 초기값 평가 (함수형 초기값 지원)
    - Object.is로 값 비교
    - 상태 변경 시 재렌더링 스케줄링
  - `useEffect`: 사이드 이펙트 훅
    - 의존성 배열 비교 (shallowEquals)
    - 이펙트 큐에 추가
    - 클린업 함수 관리
  - `cleanupUnusedHooks`: 미사용 훅 정리
  - `flushEffects`: 예약된 이펙트 실행

### 2. 심화 과제 (단계 7)

#### 단계 7: 확장 Hook & HOC

- **파일**: `hooks/*.ts`, `hocs/*.ts`
- **기능**:
  - `useRef`: 리렌더링 없이 값 유지
  - `useMemo`: 계산 결과 메모이제이션 (shallow 비교)
  - `useCallback`: 함수 메모이제이션
  - `useDeepMemo`: 깊은 비교 기반 메모이제이션
  - `useAutoCallback`: 최신 상태 참조하면서 참조 안정적인 콜백
  - `memo`: props 얕은 비교 기반 컴포넌트 메모이제이션
  - `deepMemo`: props 깊은 비교 기반 컴포넌트 메모이제이션

---

## 🤝 Human-in-the-loop 학습 시스템

이 프로젝트는 **Human-in-the-loop** 방식으로 진행됩니다. 학생은 단계별로 학습하고 구현하며, 각 단계마다 질문하고 피드백을 받는 과정을 반복합니다.

### 📖 학습 자료 구조

각 단계마다 `cursor/study/step{N}/` 폴더에 학습 자료가 제공됩니다:

- **`cursor/study/step1/학습_내용.md`**: 단계 1 학습 가이드
- **`cursor/study/step2/학습_내용.md`**: 단계 2 학습 가이드 (단계 2 진행 시 생성)
- ...

### 👨‍🏫 Teacher 오퍼레이션

**Teacher 오퍼레이션**은 학생이 질문할 때 활성화되는 학습 지원 시스템입니다.

#### Teacher 오퍼레이션 사용 방법

1. **질문 방법**:
   - "Teacher에게 질문" 또는 "Teacher, ..." 형식으로 질문
   - 예: "Teacher, 단계 1의 createElement 함수가 왜 필요한가요?"

2. **Teacher의 역할**:
   - 각 단계별 개념 설명
   - 구현 방법 가이드
   - 코드 리뷰 및 피드백
   - 문제 해결 지원
   - 다음 단계 안내

3. **학습 흐름**:
   ```
   1. 학생이 단계 N 명세서(docs/step-N.md) 읽기
   2. study/stepN/학습_내용.md로 개념 학습
   3. 구현 시작
   4. 질문 발생 시 → Teacher 오퍼레이션 활성화
   5. Teacher가 답변 및 피드백 제공
   6. 구현 완료 후 테스트 통과 확인
   7. 다음 단계로 진행
   ```

#### Teacher 오퍼레이션 응답 규칙

- **상세한 설명**: 개념부터 구현까지 단계별로 설명
- **예제 제공**: 코드 예제와 함께 설명
- **체크리스트 확인**: 단계별 체크리스트를 함께 확인
- **다음 단계 안내**: 완료 후 다음 단계로의 연결 고리 제공

#### Teacher 오퍼레이션 코드 작성 규칙 (중요!)

**기존 코드를 절대 임의로 수정하지 마세요!**

1. **기존 코드 유지 원칙**:
   - 파일에 이미 작성된 코드나 주석을 임의로 변경하지 않음
   - 기존 타입 시그니처, 파라미터명, 주석 내용을 그대로 유지
   - 예: `(node: VNode)`가 있으면 `(node: any)`로 바꾸지 않음
   - 예: `// 여기를 구현하세요.` 주석을 삭제하거나 변경하지 않음

2. **주석 보존 원칙**:
   - 기존 주석을 삭제하거나 내용을 변경하지 않음
   - 기존 주석의 형식과 스타일을 유지
   - 새로운 주석은 필요한 경우에만 추가 (기존 주석과 구분)

3. **구현 원칙**:
   - `// 여기를 구현하세요.` 주석이 있는 부분만 구현
   - 기존 코드 구조와 스타일을 따라 구현
   - 기존 함수 시그니처는 그대로 유지하고 내부 로직만 구현

4. **예시**:

   ```typescript
   // ❌ 잘못된 예 - 기존 코드 변경
   export const normalizeNode = (node: any): VNode | null => {
     // VNode -> any 변경 금지!
     // 구현...
   };

   // ✅ 올바른 예 - 기존 코드 유지
   export const normalizeNode = (node: VNode): VNode | null => {
     // 기존 타입 유지
     // 여기를 구현하세요.  // 주석 그대로 유지
     // 구현...
   };
   ```

### 📚 단계별 학습 자료 생성

각 단계가 진행될 때마다:

1. **명세서 확인**: `cursor/docs/step-N.md` 읽기
2. **학습 자료 생성**: `cursor/study/stepN/학습_내용.md` 작성
   - 해당 단계의 핵심 개념
   - 구현해야 할 함수들의 상세 설명
   - 왜 필요한지, 어떻게 동작하는지
   - 자주 하는 실수와 주의사항
   - 실습 예제

3. **Teacher 지원**:
   - 학습 자료 기반으로 질문 답변
   - 구현 도중 발생하는 문제 해결
   - 코드 리뷰 및 피드백

---

## 📚 필수 지식 요약

### 1. VNode와 컴포넌트 모델

- JSX는 VNode 트리로 변환됨
- Key와 Path로 컴포넌트 식별 (훅 상태 격리)
- Fragment는 실제 DOM 없이 자식만 렌더링

### 2. 렌더 사이클

- 루트 컨테이너 초기화 → Reconciliation → DOM 업데이트 → 훅 정리
- 여러 상태 업데이트를 배치 처리 (한 번만 렌더링)

### 3. Reconciliation 전략

- 타입/키 비교로 마운트/업데이트/언마운트 결정
- Key 기반 자식 매칭으로 DOM 이동 최소화
- Fragment/컴포넌트는 첫 번째 DOM 노드를 참조

### 4. Hook 컨텍스트

- **경로(Path) 기반 상태 격리**: 각 컴포넌트마다 고유 경로로 훅 상태 저장
- **커서(Cursor)로 호출 순서 추적**: 렌더 간 동일한 순서 보장
- **컴포넌트 스택**: 현재 실행 중인 컴포넌트 경로 추적

### 5. 스케줄링

- 마이크로태스크 큐로 렌더링과 이펙트를 비동기 처리
- 중복 실행 방지 플래그로 배치 처리

---

## 🔧 학습자(학생) 구현 가이드

### 구현 원칙

1. **단계별 구현**: 단계 1부터 순서대로 진행
2. **학습 자료 참조**: 각 단계 시작 전 `cursor/study/stepN/학습_내용.md` 읽기
3. **명세서 참조**: 구현 전 `cursor/docs/step-N.md` 반드시 읽기
4. **테스트 기반**: 각 단계 완료 후 해당 테스트 통과 확인
5. **질문하기**: 막히는 부분이 있으면 Teacher 오퍼레이션 활성화
6. **타입 안정성**: TypeScript 타입 정의 준수
7. **에러 처리**: 예외 상황 명확히 처리

### 학습자 워크플로우

```
1. 단계 N 시작
   ↓
2. cursor/docs/step-N.md 읽기 (명세서)
   ↓
3. cursor/study/stepN/학습_내용.md 읽기 (학습 자료)
   ↓
4. 구현 시작
   ↓
5. 막히는 부분 있으면 → Teacher에게 질문
   ↓
6. 구현 완료
   ↓
7. 테스트 실행 및 통과 확인
   ↓
8. 다음 단계로 진행
```

### 구현 순서

```
단계 1 (기초 유틸리티)
  ↓
단계 2 (컨텍스트 초기화)
  ↓
단계 3 (DOM 인터페이스)
  ↓
단계 4 (렌더 스케줄링)
  ↓
단계 5 (Reconciliation)
  ↓
단계 6 (기본 Hooks)
  ↓
단계 7 (확장 Hooks & HOC) [심화]
```

### 각 단계별 체크리스트

#### ✅ 단계 1 체크리스트

- [ ] `TEXT_ELEMENT`, `Fragment`, `NodeTypes`, `HookTypes` 상수 정의
- [ ] `isEmptyValue`: null/undefined/boolean 필터링
- [ ] `shallowEquals`: 1단계 깊이 비교 (Object.is 사용)
- [ ] `deepEquals`: 재귀적 깊은 비교
- [ ] `createElement`: JSX → VNode 변환 (children 정규화 포함)
- [ ] `normalizeNode`: 원시 타입 → VNode 변환
- [ ] `createChildPath`: key/index 기반 경로 생성

#### ✅ 단계 2 체크리스트

- [ ] VNode, Instance, Context 타입 정의
- [ ] `context.root`: container, node, instance 관리
- [ ] `context.hooks`: state Map, cursor Map, visited Set, componentStack
- [ ] `context.hooks.currentPath`: 컴포넌트 스택에서 경로 가져오기
- [ ] `context.hooks.currentCursor`: 현재 훅 커서
- [ ] `context.hooks.currentHooks`: 현재 훅 상태 배열
- [ ] `setup`: 컨테이너 초기화, 컨텍스트 리셋, 렌더 트리거
- [ ] `createRoot`: React 18 스타일 API

#### ✅ 단계 3 체크리스트

- [ ] `setDomProps`: 이벤트 핸들러, style, className, 일반 속성 설정
- [ ] `updateDomProps`: 변경된 속성만 업데이트, 이전 이벤트 제거
- [ ] `getDomNodes`: 인스턴스에서 모든 DOM 노드 재귀 탐색
- [ ] `getFirstDom`: 첫 번째 DOM 노드 찾기
- [ ] `getFirstDomFromChildren`: 자식에서 첫 DOM 찾기
- [ ] `insertInstance`: anchor 앞에 삽입
- [ ] `removeInstance`: DOM에서 제거

#### ✅ 단계 4 체크리스트

- [ ] `enqueue`: queueMicrotask 또는 Promise.resolve 사용
- [ ] `withEnqueue`: scheduled 플래그로 중복 방지
- [ ] `render`: 훅 컨텍스트 초기화 → reconcile → cleanupUnusedHooks → flushEffects
- [ ] `enqueueRender`: withEnqueue로 래핑

#### ✅ 단계 5 체크리스트

- [ ] `reconcile`: null 처리, 타입/키 비교, mount/update 분기
- [ ] `mount`: TEXT_ELEMENT, Fragment, 컴포넌트, DOM 요소 처리
- [ ] `mountComponent`: 훅 컨텍스트 설정, 컴포넌트 실행, 자식 마운트
- [ ] `update`: 텍스트, Fragment, 컴포넌트, DOM 요소 업데이트
- [ ] `updateComponent`: 훅 컨텍스트 복원, 컴포넌트 재실행, 자식 reconcile
- [ ] 자식 배열 비교 및 최적화

#### ✅ 단계 6 체크리스트

- [ ] `useState`: 경로/커서로 상태 조회, 초기값 평가, setter 생성, 재렌더링 스케줄링
- [ ] `useEffect`: 의존성 비교, 이펙트 큐 추가, 클린업 관리
- [ ] `cleanupUnusedHooks`: 방문하지 않은 컴포넌트의 훅 정리
- [ ] `flushEffects`: 예약된 이펙트 비동기 실행

#### ✅ 단계 7 체크리스트 (심화)

- [ ] `useRef`: useState로 ref 객체 한 번만 생성
- [ ] `useMemo`: useRef로 이전 값/deps 저장, equals로 비교
- [ ] `useCallback`: useMemo로 함수 메모이제이션
- [ ] `useDeepMemo`: useMemo에 deepEquals 전달
- [ ] `useAutoCallback`: useRef + useCallback 조합
- [ ] `memo`: props 얕은 비교로 컴포넌트 메모이제이션
- [ ] `deepMemo`: props 깊은 비교로 컴포넌트 메모이제이션

---

## 🧪 테스트 전략

### 테스트 실행 순서

1. **기본 과제**: `basic.equals.test.tsx` → `basic.mini-react.test.tsx`
2. **심화 과제**: `advanced.hooks.test.tsx` → `advanced.hoc.test.tsx`
3. **전체 테스트**: 모든 테스트 통과 확인

### 각 단계 완료 후 확인

- 해당 단계의 테스트 케이스 통과
- 다음 단계로 진행 가능 여부 확인

---

## ⚠️ 주의사항 및 규칙

### Hook 규칙

1. **컴포넌트 내부에서만 호출**: `currentPath`가 없으면 에러 발생
2. **호출 순서 유지**: 조건문/반복문 안에서 훅 호출 금지
3. **경로 기반 격리**: 각 컴포넌트의 훅 상태는 경로로 완전히 격리

### Reconciliation 규칙

1. **Key 우선**: Key가 있으면 key로 매칭, 없으면 index로 매칭
2. **타입/키 변경 시 재마운트**: 기존 인스턴스 제거 후 새로 생성
3. **Fragment/컴포넌트 DOM 참조**: 첫 번째 자식 DOM 노드 사용

### 에러 처리

1. **컨테이너 유효성**: setup에서 컨테이너 없으면 에러
2. **훅 호출 위치**: 컴포넌트 외부에서 호출 시 에러
3. **타입 안정성**: TypeScript 타입 체크 통과

---

## 📖 참고 문서

### 필수 읽기 순서

1. **03-fundamental-knowledge.md**: 핵심 개념 이해
2. **02-sequence-diagrams.md**: 전체 플로우 시각화
3. **01-implementation-guide.md**: 단계별 구현 가이드

### 주요 개념 문서 위치

- VNode 모델: `03-fundamental-knowledge.md` 섹션 1
- 렌더 사이클: `03-fundamental-knowledge.md` 섹션 2
- Reconciliation: `03-fundamental-knowledge.md` 섹션 3
- Hook 컨텍스트: `03-fundamental-knowledge.md` 섹션 5
- 스케줄링: `03-fundamental-knowledge.md` 섹션 6

---

## 🎓 학습 목표 달성 기준

### 기본 과제 완료 기준

- ✅ `basic.equals.test.tsx` 모든 테스트 통과
- ✅ `basic.mini-react.test.tsx` 모든 테스트 통과
- ✅ 브라우저에서 실제 앱이 정상 동작

### 심화 과제 완료 기준

- ✅ `advanced.hooks.test.tsx` 모든 테스트 통과
- ✅ `advanced.hoc.test.tsx` 모든 테스트 통과
- ✅ 모든 Hook과 HOC가 정상 동작

---

## 💡 구현 팁

### 디버깅

- `context.hooks.currentPath`, `currentCursor`, `currentHooks` 로그 출력
- `reconcile` 함수에서 타입/키 비교 로그
- 의존성 배열 비교 결과 로그

### 성능 최적화

- Key 기반 자식 매칭으로 DOM 이동 최소화
- 얕은 비교로 불필요한 재렌더링 방지
- 메모이제이션으로 계산 비용 절감

### 코드 품질

- 타입 안정성 유지
- 에러 메시지 명확히 작성
- 주석으로 복잡한 로직 설명

---

## 📝 Teacher 오퍼레이션 사용 예시

### 예시 1: 개념 질문

```
학생: "Teacher, Virtual DOM이 실제 DOM보다 왜 빠른가요?"
Teacher: [Virtual DOM의 동작 원리와 성능 최적화 방법 설명]
```

### 예시 2: 구현 질문

```
학생: "Teacher, createElement에서 children을 정규화할 때 왜 빈 값을 필터링하나요?"
Teacher: [isEmptyValue의 역할과 React의 렌더링 규칙 설명]
```

### 예시 3: 디버깅 질문

```
학생: "Teacher, 테스트가 실패하는데 shallowEquals가 제대로 동작하지 않는 것 같아요"
Teacher: [코드 확인 및 문제점 분석, 해결 방법 제시]
```

---

이 명세서와 Human-in-the-loop 시스템을 통해 단계적으로 학습하면 React의 내부 동작 원리를 깊이 이해할 수 있습니다! 🚀
