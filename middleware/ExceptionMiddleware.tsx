import { handleHighLevelError } from '@/utils/loggingUtil';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ExceptionMiddlewareProps = {
  children: React.ReactNode;
};

type ExceptionMiddlewareState = {
  hasError: boolean;
};

type GlobalErrorUtils = {
  getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

export default class ExceptionMiddleware extends React.Component<
  ExceptionMiddlewareProps,
  ExceptionMiddlewareState
> {
  private previousGlobalHandler?: (error: unknown, isFatal?: boolean) => void;

  constructor(props: ExceptionMiddlewareProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount(): void {
    const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;

    if (!errorUtils?.setGlobalHandler) {
      return;
    }

    this.previousGlobalHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((error, isFatal) => {
      void handleHighLevelError({
        operation: isFatal ? 'processar falha crítica da aplicação' : 'processar falha inesperada da aplicação',
        error,
      });

      this.previousGlobalHandler?.(error, isFatal);
    });
  }

  componentDidCatch(error: Error): void {
    this.setState({ hasError: true });
    void handleHighLevelError({
      operation: 'renderizar a aplicação',
      error,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.description}>
            A aplicação encontrou uma falha inesperada.
          </Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#25292e',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minWidth: 180,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
