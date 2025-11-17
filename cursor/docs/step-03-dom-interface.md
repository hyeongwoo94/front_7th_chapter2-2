# 단계 3: DOM 인터페이스

## 📋 개요

이 단계에서는 Virtual DOM과 실제 DOM 사이의 브릿지 역할을 하는 DOM 인터페이스를 구현합니다. 속성 설정, 이벤트 처리, DOM 노드 탐색 및 조작 함수를 제공합니다.

## 🎯 학습 목표

- DOM 속성 설정 및 업데이트 패턴 이해
- 이벤트 핸들러 등록 및 제거 메커니즘 이해
- 스타일 객체를 DOM 스타일로 변환하는 방법 이해
- DOM 노드 탐색 및 조작 API 이해

## 📁 구현 파일

### `packages/react/src/core/dom.ts`
DOM 조작 함수

#### 구현 항목

##### `setDomProps(dom, props)`
- **목적**: DOM 요소에 속성 설정
- **파라미터**:
  - `dom`: HTMLElement 또는 Text
  - `props`: 속성 객체

**구현 요구사항**:
1. **이벤트 핸들러 처리**:
   - `on`으로 시작하는 props는 이벤트 리스너로 등록
   - 예: `onClick` → `click` 이벤트
   - 이벤트명은 소문자로 변환하고 `on` 제거
2. **스타일 처리**:
   - `style`이 객체면 각 속성을 camelCase → kebab-case 변환
   - 예: `{ color: 'red' }` → `style.color = 'red'`
3. **className 처리**:
   - `className` prop을 `class` 속성으로 설정
4. **일반 속성**:
   - 그 외 props는 DOM 속성으로 직접 설정
   - `htmlFor` → `for` 변환 (label 요소)

**예시**:
```typescript
setDomProps(dom, {
  onClick: () => console.log('click'),
  style: { color: 'red', fontSize: '14px' },
  className: 'my-class',
  id: 'my-id'
});
```

##### `updateDomProps(dom, prevProps, nextProps)`
- **목적**: DOM 속성 업데이트 (변경된 것만)
- **파라미터**:
  - `dom`: HTMLElement 또는 Text
  - `prevProps`: 이전 속성
  - `nextProps`: 새 속성

**구현 요구사항**:
1. **제거된 속성 처리**:
   - `prevProps`에만 있는 속성 제거
   - 이벤트 핸들러는 `removeEventListener` 호출
2. **추가/변경된 속성 처리**:
   - `nextProps`에 있는 속성 설정
   - 이벤트 핸들러는 기존 리스너 제거 후 새로 등록
   - `setDomProps` 로직 재사용
3. **최적화**:
   - 실제로 변경된 속성만 업데이트
   - 이벤트 핸들러는 항상 제거 후 재등록 (함수 참조 변경 가능)

##### `getDomNodes(instance)`
- **목적**: 인스턴스에서 모든 DOM 노드 재귀 탐색
- **파라미터**: Instance 또는 null
- **반환**: (HTMLElement | Text)[]

**구현 요구사항**:
1. `instance`가 null이면 빈 배열 반환
2. `instance.dom`이 있으면 포함
3. `instance.children`이 있으면 재귀적으로 탐색
4. `instance.childInstance`가 있으면 (컴포넌트) 재귀 탐색
5. Fragment는 자식만 탐색 (자신은 DOM 없음)

##### `getFirstDom(instance)`
- **목적**: 인스턴스의 첫 번째 DOM 노드 찾기
- **파라미터**: Instance 또는 null
- **반환**: HTMLElement | Text | null

**구현 요구사항**:
1. `instance`가 null이면 null 반환
2. `instance.dom`이 있으면 반환
3. `instance.children`에서 첫 번째 DOM 찾기
4. `instance.childInstance`에서 첫 번째 DOM 찾기 (컴포넌트)

##### `getFirstDomFromChildren(children)`
- **목적**: 자식 인스턴스 배열에서 첫 번째 DOM 찾기
- **파라미터**: Instance[] 또는 undefined
- **반환**: HTMLElement | Text | null

**구현 요구사항**:
1. `children`이 없으면 null
2. 각 자식에서 `getFirstDom` 호출
3. 첫 번째로 발견된 DOM 반환

##### `insertInstance(parentDom, instance, anchor)`
- **목적**: DOM에 인스턴스 삽입
- **파라미터**:
  - `parentDom`: 부모 DOM 요소
  - `instance`: 삽입할 인스턴스
  - `anchor`: 삽입 위치 기준점 (선택사항)

**구현 요구사항**:
1. `instance`가 null이면 아무 작업 없음
2. `getDomNodes(instance)`로 모든 DOM 노드 가져오기
3. `anchor`가 있으면 `insertBefore`, 없으면 `appendChild`
4. 모든 DOM 노드를 순서대로 삽입

##### `removeInstance(parentDom, instance)`
- **목적**: DOM에서 인스턴스 제거
- **파라미터**:
  - `parentDom`: 부모 DOM 요소
  - `instance`: 제거할 인스턴스

**구현 요구사항**:
1. `instance`가 null이면 아무 작업 없음
2. `getDomNodes(instance)`로 모든 DOM 노드 가져오기
3. 각 DOM 노드를 `removeChild`로 제거
4. 역순으로 제거 (DOM 순서 유지)

---

## ✅ 체크리스트

- [ ] `setDomProps`: 이벤트 핸들러 등록 구현
- [ ] `setDomProps`: 스타일 객체 처리 구현
- [ ] `setDomProps`: className 처리 구현
- [ ] `setDomProps`: 일반 속성 설정 구현
- [ ] `updateDomProps`: 제거된 속성 처리 구현
- [ ] `updateDomProps`: 변경된 속성 업데이트 구현
- [ ] `updateDomProps`: 이벤트 핸들러 제거/재등록 구현
- [ ] `getDomNodes`: 재귀적 DOM 노드 탐색 구현
- [ ] `getFirstDom`: 첫 번째 DOM 노드 찾기 구현
- [ ] `getFirstDomFromChildren`: 자식에서 첫 DOM 찾기 구현
- [ ] `insertInstance`: DOM 삽입 구현
- [ ] `removeInstance`: DOM 제거 구현

---

## 🧪 테스트 확인

이 단계의 함수들은 다음 단계(Reconciliation)와 함께 테스트됩니다.

직접 테스트할 수 있는 항목:
- `setDomProps`가 올바르게 속성을 설정하는지
- 이벤트 핸들러가 올바르게 등록되는지
- `updateDomProps`가 변경사항만 업데이트하는지

---

## 📚 참고 사항

### 이벤트명 변환 규칙
```typescript
onClick → click
onChange → change
onMouseEnter → mouseenter
// 첫 문자는 소문자, 나머지는 그대로
```

### 스타일 변환 규칙
```typescript
// camelCase → kebab-case (실제로는 DOM에서 camelCase 사용)
{ fontSize: '14px' } → style.fontSize = '14px'
{ backgroundColor: 'red' } → style.backgroundColor = 'red'
```

### DOM 노드 탐색 우선순위
1. `instance.dom` (직접 DOM)
2. `instance.children` (자식 인스턴스들)
3. `instance.childInstance` (컴포넌트의 자식)

### Fragment 처리
- Fragment는 `dom` 속성이 없음
- 자식만 탐색하여 DOM 노드 반환

---

## ⚠️ 주의사항

1. **이벤트 핸들러**: 항상 제거 후 재등록 (참조 변경 대응)
2. **Text 노드**: Text 노드는 대부분의 속성을 설정할 수 없음 (예외 처리 필요)
3. **스타일 객체**: 객체일 때만 처리, 문자열은 그대로 설정
4. **DOM 순서**: `insertInstance`에서 노드 순서 유지 필수
5. **제거 순서**: `removeInstance`에서 역순 제거로 인덱스 오류 방지

---

## 🔄 다음 단계

이 단계를 완료한 후 → [단계 4: 렌더 스케줄링](./step-04-render-scheduling.md)

