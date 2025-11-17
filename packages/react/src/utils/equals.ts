/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // Object.is(), Array.isArray(), Object.keys() 등을 활용하여 1단계 깊이의 비교를 구현합니다.
  if (Object.is(a, b)) {
    return true;
  }

  if (a === null || b === null || a === undefined || b === undefined) {
    return false;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown, visited = new WeakSet()): boolean => {
  // 여기를 구현하세요.
  // 재귀적으로 deepEquals를 호출하여 중첩된 구조를 비교해야 합니다.
  if (Object.is(a, b)) {
    return true;
  }

  if (a === null || b === null || a === undefined || b === undefined) {
    return false;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a !== "object") {
    return false;
  }

  if (visited.has(a as object) && visited.has(b as object)) {
    return true;
  }

  visited.add(a as object);
  visited.add(b as object);

  try {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEquals(a[i], b[i], visited)) {
          return false;
        }
      }
      return true;
    }

    if (typeof a === "object" && typeof b === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], visited)) {
          return false;
        }
      }
      return true;
    }

    return false;
  } finally {
    // WeakSet은 가비지 컬렉션에 의해 자동으로 정리됨
  }
};
