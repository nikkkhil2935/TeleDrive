import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { db } from '../db';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Rendering Encountered an Issue</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected database or state synchronization error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
            <button
              onClick={async () => {
                try {
                  await db.delete();
                } catch (e) {}
                window.location.reload();
              }}
              className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
