
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  // Children must be optional to satisfy the ReactNode type in some contexts
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch rendering errors and display a fallback UI.
 */
// Explicitly use React.Component to ensure properties like setState and props are correctly resolved by TypeScript
export class ErrorBoundary extends React.Component<Props, State> {
  // Initialize state with explicit types, inheriting properly from Component
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  // Use componentDidCatch to log error information and update state
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state to include error information for debugging
    // This method exists on the base React.Component class
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-200 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center mb-4 tracking-tight uppercase">Opa! Algo deu errado.</h1>
            <p className="text-slate-400 text-sm text-center mb-8">Ocorreu um erro inesperado na aplicação. Você pode tentar recarregar a página.</p>
            
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 overflow-auto max-h-40 font-mono text-[10px] text-rose-700 border border-rose-100 shadow-inner">
              <p className="font-bold mb-2">{this.state.error?.toString()}</p>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    // Accessing children from this.props which is properly inherited from React.Component
    return this.props.children;
  }
}
