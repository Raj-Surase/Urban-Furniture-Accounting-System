import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Accordion, AccordionItem } from '@heroui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full border border-danger-200/80 dark:border-danger-900/50 bg-content1/95 backdrop-blur-xl shadow-xl rounded-2xl">
            <CardHeader className="flex gap-3 pb-2 pt-6 px-6">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Something went wrong in {this.props.componentName || 'this view'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  An unhandled rendering exception occurred. You can retry or return to the dashboard.
                </p>
              </div>
            </CardHeader>

            <CardBody className="space-y-4 px-6 pb-6">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-mono break-all">
                {this.state.error?.message || 'Unknown application error'}
              </div>

              {this.state.error?.stack && (
                <Accordion variant="bordered" className="px-0">
                  <AccordionItem
                    key="trace"
                    aria-label="Diagnostic Trace"
                    title={<span className="text-xs font-semibold text-gray-600 dark:text-gray-400">View Stack Diagnostics</span>}
                  >
                    <div className="relative">
                      <pre className="text-[11px] font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                      <Button
                        size="sm"
                        variant="flat"
                        className="absolute top-2 right-2 text-xs"
                        startContent={this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        onPress={this.handleCopyError}
                      >
                        {this.state.copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  color="primary"
                  variant="solid"
                  onPress={this.handleReset}
                  startContent={<RefreshCw className="w-4 h-4" />}
                  className="font-medium"
                >
                  Try Again
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => (window.location.href = '/')}
                  startContent={<Home className="w-4 h-4" />}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
