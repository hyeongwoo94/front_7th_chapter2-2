# Cursor 기본 규칙 명세서

이 폴더는 React Hook 구현 프로젝트의 단계별 명세서를 담고 있습니다. 각 단계별로 구현해야 할 기능과 요구사항을 상세히 정리했습니다.

## 📚 문서 목록

### 기본 과제 (Phase 1-6)

1. **[단계 1: VNode와 기초 유틸리티](./step-01-vnode-utilities.md)**
   - VNode 구조 정의
   - JSX → VNode 변환
   - 값 비교 유틸리티 (shallowEquals, deepEquals)
   - 컴포넌트 경로 생성

2. **[단계 2: 컨텍스트와 루트 초기화](./step-02-context-root.md)**
   - Context 구조 정의
   - 루트/훅 컨텍스트 관리
   - 컴포넌트 스택 및 경로 관리
   - `setup`, `createRoot` 구현

3. **[단계 3: DOM 인터페이스](./step-03-dom-interface.md)**
   - DOM 속성 설정/업데이트
   - 이벤트 핸들러 등록/제거
   - DOM 노드 탐색 및 조작
   - 스타일 객체 변환

4. **[단계 4: 렌더 스케줄링](./step-04-render-scheduling.md)**
   - 마이크로태스크 큐 기반 스케줄링
   - 중복 실행 방지 패턴
   - 렌더링 사이클 구현
   - 배치 처리

5. **[단계 5: Reconciliation](./step-05-reconciliation.md)**
   - Virtual DOM 비교 알고리즘
   - 마운트/업데이트/언마운트
   - Key 기반 최적화
   - 컴포넌트 및 DOM 요소 처리

6. **[단계 6: 기본 Hook 시스템](./step-06-basic-hooks.md)**
   - `useState` 구현
   - `useEffect` 구현
   - 훅 상태 관리 및 정리
   - 의존성 비교 및 클린업

### 심화 과제 (Phase 7)

7. **[단계 7: 확장 Hook & HOC](./step-07-advanced-hooks-hoc.md)**
   - `useRef`, `useMemo`, `useCallback`
   - `useDeepMemo`, `useAutoCallback`
   - `memo`, `deepMemo` HOC
   - 메모이제이션 패턴

---

## 🎯 사용 방법

1. **순서대로 진행**: 단계 1부터 순서대로 구현하세요.
2. **명세서 참조**: 각 단계의 명세서를 읽고 체크리스트를 확인하세요.
3. **테스트 실행**: 각 단계 완료 후 해당 테스트를 실행하여 확인하세요.
4. **다음 단계로**: 테스트 통과 후 다음 단계로 진행하세요.

---

## ✅ 기본 과제 완료 기준

다음 테스트가 모두 통과해야 합니다:

```bash
npm test basic.equals.test.tsx
npm test basic.mini-react.test.tsx
```

---

## 🚀 심화 과제 완료 기준

다음 테스트가 모두 통과해야 합니다:

```bash
npm test advanced.hooks.test.tsx
npm test advanced.hoc.test.tsx
```

---

## 📖 참고 문서

- [teacher.md](../teacher.md): 전체 프로젝트 개요 및 학습 목표
- [docs/01-implementation-guide.md](../../docs/01-implementation-guide.md): 구현 가이드 및 수도코드
- [docs/02-sequence-diagrams.md](../../docs/02-sequence-diagrams.md): 시퀀스 다이어그램
- [docs/03-fundamental-knowledge.md](../../docs/03-fundamental-knowledge.md): 기초 지식

---

## 💡 팁

- 각 단계의 체크리스트를 활용하여 진행 상황을 추적하세요.
- 테스트 실패 시 에러 메시지를 자세히 확인하세요.
- 복잡한 로직은 주석으로 설명을 추가하세요.
- 타입 안정성을 유지하기 위해 TypeScript 타입을 명확히 정의하세요.

---

## ⚠️ 주의사항

1. **훅 규칙**: 컴포넌트 내부에서만 호출, 호출 순서 유지
2. **경로 격리**: 각 컴포넌트의 훅 상태는 경로로 완전히 격리
3. **비동기 처리**: 렌더링과 이펙트는 비동기로 처리
4. **DOM 최적화**: 불필요한 DOM 조작 최소화
5. **에러 처리**: 예외 상황을 명확히 처리

---

좋은 학습 되시길 바랍니다! 🎉
