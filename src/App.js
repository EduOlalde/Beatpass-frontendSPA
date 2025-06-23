import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './components/AuthContext';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-gray-100 font-inter antialiased">
      <AuthProvider>
        <Router>
          <main className="container mx-auto p-4 md:p-8">
            <AppRoutes />
          </main>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
