describe('requestLoadingService', () => {
  const loadService = () => require('./requestLoadingService') as typeof import('./requestLoadingService');

  beforeEach(() => {
    jest.resetModules();
  });

  it('notifies listeners when loading starts and ends', () => {
    const {
      beginRequestLoading,
      endRequestLoading,
      subscribeRequestLoading,
    } = loadService();

    const listener = jest.fn();
    const unsubscribe = subscribeRequestLoading(listener);

    beginRequestLoading();
    endRequestLoading();

    expect(listener).toHaveBeenNthCalledWith(1, false);
    expect(listener).toHaveBeenNthCalledWith(2, true);
    expect(listener).toHaveBeenNthCalledWith(3, false);

    unsubscribe();
  });

  it('does not let pending requests go below zero', () => {
    const {
      endRequestLoading,
      subscribeRequestLoading,
    } = loadService();

    const listener = jest.fn();
    subscribeRequestLoading(listener);

    endRequestLoading();

    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it('stops notifying after unsubscribe', () => {
    const {
      beginRequestLoading,
      subscribeRequestLoading,
    } = loadService();

    const listener = jest.fn();
    const unsubscribe = subscribeRequestLoading(listener);

    unsubscribe();
    beginRequestLoading();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rethrows listener errors during subscription', () => {
    const { subscribeRequestLoading } = loadService();
    const listener = jest.fn(() => {
      throw new Error('listener-failed');
    });

    expect(() => subscribeRequestLoading(listener)).toThrow('listener-failed');
  });
});
