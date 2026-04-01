import React from 'react';
import ExceptionMiddleware from './ExceptionMiddleware';
import { handleHighLevelError } from '@/utils/loggingUtil';

jest.mock('@/util/loggingUtil', () => ({
  handleHighLevelError: jest.fn(),
}));

const mockHandleHighLevelError = handleHighLevelError as jest.MockedFunction<typeof handleHighLevelError>;

function syncSetState(instance: ExceptionMiddleware) {
  (instance as any).setState = (update: any) => {
    const nextState =
      typeof update === 'function'
        ? update((instance as any).state, (instance as any).props)
        : update;

    (instance as any).state = {
      ...(instance as any).state,
      ...nextState,
    };
  };
}

function collectText(node: any): string[] {
  if (node == null) {
    return [];
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  return collectText(node.props?.children);
}

describe('ExceptionMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).ErrorUtils;
  });

  it('renders children when there is no error', () => {
    const child = React.createElement('MockChild', { id: 'child' });
    const instance = new ExceptionMiddleware({ children: child });

    expect(instance.render()).toBe(child);
  });

  it('registers a global error handler on mount', async () => {
    const previousHandler = jest.fn();
    const setGlobalHandler = jest.fn();
    const getGlobalHandler = jest.fn(() => previousHandler);
    (globalThis as any).ErrorUtils = {
      getGlobalHandler,
      setGlobalHandler,
    };

    const instance = new ExceptionMiddleware({ children: null });
    instance.componentDidMount();

    expect(getGlobalHandler).toHaveBeenCalledTimes(1);
    expect(setGlobalHandler).toHaveBeenCalledTimes(1);

    const installedHandler = setGlobalHandler.mock.calls[0][0];
    const error = new Error('fatal crash');
    installedHandler(error, true);

    expect(mockHandleHighLevelError).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        operation: expect.stringContaining('processar falha'),
      })
    );
    expect(previousHandler).toHaveBeenCalledWith(error, true);
  });

  it('logs and renders fallback UI after componentDidCatch', () => {
    const instance = new ExceptionMiddleware({ children: null });
    syncSetState(instance);
    const error = new Error('render failed');

    instance.componentDidCatch(error);

    expect(mockHandleHighLevelError).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        operation: expect.stringContaining('renderizar'),
      })
    );

    const rendered = instance.render();
    const texts = collectText(rendered);

    expect(texts).toContain('Algo deu errado');
    expect(texts).toContain('Tentar novamente');
  });

  it('resets error state when retry button is pressed', () => {
    const instance = new ExceptionMiddleware({ children: React.createElement('MockChild') });
    syncSetState(instance);
    (instance as any).state = { hasError: true };

    const rendered = instance.render() as any;
    const pressable = rendered.props.children[2];

    pressable.props.onPress();

    expect((instance as any).state.hasError).toBe(false);
  });
});
