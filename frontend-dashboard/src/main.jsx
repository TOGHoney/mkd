import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppLayout from './components/layout/AppLayout';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Dashboard Error Boundary]', error, errorInfo);
  }

  handleReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-surface-900 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WorkspaceProvider>
          <AppLayout />
        </WorkspaceProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
