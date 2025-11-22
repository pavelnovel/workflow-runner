import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props!: Props;

  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an error, likely due to corrupted data saved in your browser.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg text-left mb-6 overflow-hidden">
                <p className="text-xs font-mono text-red-500 break-all">
                    {this.state.error?.message || 'Unknown error'}
                </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              Reset Application Data
            </button>
            <p className="text-xs text-gray-400 mt-4">
              This will clear your templates and workflows and reload the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}