import { describe, expect, it } from 'vitest';
import { emit, off, on } from '../../src/core/events.ts';

describe('event bus', () => {
  it('calls handlers in the order they were registered, with the payload', () => {
    const seen = [];
    on('t:order', p => seen.push(['a', p]));
    on('t:order', p => seen.push(['b', p]));
    emit('t:order', 42);
    expect(seen).toEqual([['a', 42], ['b', 42]]);
  });

  it('emitting with no payload and no listeners is fine', () => {
    let got = 'unset';
    on('t:nopayload', p => { got = p; });
    emit('t:nopayload');
    expect(got).toBeUndefined();
    expect(() => emit('t:nobody-listens', 1)).not.toThrow();
  });

  it('on() returns an unsubscribe function, and off() removes one handler only', () => {
    const calls = [];
    const a = () => calls.push('a'), b = () => calls.push('b');
    const unsubA = on('t:off', a);
    on('t:off', b);
    unsubA();
    emit('t:off');
    expect(calls).toEqual(['b']);
    off('t:off', b);
    emit('t:off');
    expect(calls).toEqual(['b']);
    expect(() => off('t:never-registered', a)).not.toThrow();
  });

  it('a handler can unsubscribe during emit without skipping the next one', () => {
    const calls = [];
    const first = () => { calls.push('first'); off('t:self', first); };
    on('t:self', first);
    on('t:self', () => calls.push('second'));
    emit('t:self');
    emit('t:self');
    expect(calls).toEqual(['first', 'second', 'second']);
  });

  it('different event names do not interfere', () => {
    const calls = [];
    on('t:x', () => calls.push('x'));
    on('t:y', () => calls.push('y'));
    emit('t:x');
    expect(calls).toEqual(['x']);
  });
});
