'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('ErrorBoundary caught a component error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="polite"
          className="p-6 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-4 my-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">
                {this.props.fallbackTitle || 'Component Encountered a Problem'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {this.props.fallbackDescription ||
                  'An isolated rendering error occurred in this workspace. Other parts of the platform remain fully functional.'}
              </p>
              {this.state.error && (
                <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-mono text-gray-600 break-all">
                  {this.state.error.message}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={this.handleReset}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reload Workspace Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
