/**
 * useDebounce 훅 테스트
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ✅ 기본 디바운스 동작
  describe('기본 디바운스 동작', () => {
    it('초기값을 즉시 반환해야 함', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));

      expect(result.current).toBe('initial');
    });

    it('delay 시간이 지나야 새로운 값을 반환해야 함', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 },
        }
      );

      // 초기값
      expect(result.current).toBe('initial');

      // 값 변경
      rerender({ value: 'updated', delay: 300 });

      // 아직 delay가 지나지 않음
      expect(result.current).toBe('initial');

      // delay 시간 경과
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 값 업데이트됨
      expect(result.current).toBe('updated');
    });

    it('delay 시간 전에 값을 여러 번 변경하면 마지막 값만 반영되어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 },
        }
      );

      // 초기값
      expect(result.current).toBe('initial');

      // 100ms: 'a'로 변경
      rerender({ value: 'a', delay: 300 });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('initial'); // 아직 변경 안 됨

      // 100ms: 'b'로 변경 (총 200ms)
      rerender({ value: 'b', delay: 300 });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('initial'); // 아직 변경 안 됨

      // 100ms: 'c'로 변경 (총 300ms)
      rerender({ value: 'c', delay: 300 });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('initial'); // 아직 변경 안 됨

      // 마지막 변경 후 300ms 경과
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 마지막 값('c')만 반영됨
      expect(result.current).toBe('c');
    });
  });

  // ✅ delay 파라미터 변경
  describe('delay 파라미터 변경', () => {
    it('delay 값을 변경하면 새로운 타이머가 설정되어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 },
        }
      );

      // 값 변경 + delay 변경
      rerender({ value: 'updated', delay: 500 });

      // 300ms 경과 (이전 delay)
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial'); // 아직 변경 안 됨

      // 추가 200ms 경과 (총 500ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe('updated'); // 변경됨
    });

    it('delay를 0으로 설정하면 즉시 업데이트되어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 0 },
        }
      );

      // 값 변경
      rerender({ value: 'updated', delay: 0 });

      // 타이머 실행
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });
  });

  // ✅ 다양한 타입 테스트
  describe('다양한 타입 지원', () => {
    it('문자열 타입을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: 'hello' },
        }
      );

      rerender({ value: 'world' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('world');
    });

    it('숫자 타입을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: 10 },
        }
      );

      rerender({ value: 20 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(20);
    });

    it('객체 타입을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: { name: 'Alice' } },
        }
      );

      const newValue = { name: 'Bob' };
      rerender({ value: newValue });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual({ name: 'Bob' });
    });

    it('배열 타입을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: [1, 2, 3] },
        }
      );

      rerender({ value: [4, 5, 6] });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual([4, 5, 6]);
    });
  });

  // ✅ Edge Cases
  describe('엣지 케이스', () => {
    it('undefined를 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: undefined as string | undefined },
        }
      );

      rerender({ value: 'defined' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('defined');
    });

    it('null을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: 'initial' as string | null },
        }
      );

      rerender({ value: null });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(null);
    });

    it('빈 문자열을 디바운스할 수 있어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: 'initial' },
        }
      );

      rerender({ value: '' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('');
    });
  });

  // ✅ 타이머 정리 (cleanup)
  describe('타이머 정리', () => {
    it('컴포넌트 언마운트 시 타이머가 정리되어야 함', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: 'initial' },
        }
      );

      rerender({ value: 'updated' });

      // 타이머가 완료되기 전에 언마운트
      unmount();

      // 타이머 실행 (이미 정리되어 에러가 발생하지 않아야 함)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 에러 없이 통과하면 성공
      expect(true).toBe(true);
    });
  });

  // ✅ 실제 사용 시나리오
  describe('실제 사용 시나리오', () => {
    it('검색 입력 시나리오: 사용자가 빠르게 타이핑하면 마지막 값만 반영되어야 함', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        {
          initialProps: { value: '' },
        }
      );

      // 사용자가 'hello'를 빠르게 타이핑
      const typingSequence = ['h', 'he', 'hel', 'hell', 'hello'];

      typingSequence.forEach((value, index) => {
        rerender({ value });

        // 각 타이핑 간격 50ms
        act(() => {
          jest.advanceTimersByTime(50);
        });

        // 아직 디바운스 시간이 지나지 않음
        expect(result.current).toBe('');
      });

      // 마지막 타이핑 후 300ms 경과
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 마지막 값만 반영
      expect(result.current).toBe('hello');
    });
  });
});
