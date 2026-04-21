import React from 'react';
import { TelegramProvider } from './providers/TelegramProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';


const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-ping absolute" />
          <div className="w-16 h-16 border-t-4 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-secondary text-sm font-medium animate-pulse">Initializing Shop...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center text-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text">Auth Failure</h1>
          <p className="text-secondary text-sm leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full max-w-xs py-4 bg-primary text-button-text rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <Layout />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TelegramProvider>
    </QueryClientProvider>
  );
}

export default App;
