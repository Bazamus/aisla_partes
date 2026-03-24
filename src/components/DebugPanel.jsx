import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const runDiagnostics = async () => {
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_KEY,
    };

    // Test de conexión básica
    try {
      const { data: testData, error: testError } = await supabase
        .from('obras')
        .select('count')
        .single();
      
      info.testConnection = {
        success: !testError,
        data: testData,
        error: testError?.message
      };
    } catch (e) {
      info.testConnection = {
        success: false,
        error: e.message
      };
    }

    // Test de obras
    try {
      const { data: obrasData, error: obrasError } = await supabase
        .from('obras')
        .select('*')
        .limit(5);
      
      info.testObras = {
        success: !obrasError,
        count: obrasData?.length || 0,
        error: obrasError?.message
      };
    } catch (e) {
      info.testObras = {
        success: false,
        error: e.message
      };
    }

    // Test de políticas RLS
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .from('obras')
        .select('count')
        .single();
      
      info.testRLS = {
        success: !rlsError,
        count: rlsData?.count || 0,
        error: rlsError?.message
      };
    } catch (e) {
      info.testRLS = {
        success: false,
        error: e.message
      };
    }

    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      info.serviceWorker = {
        available: true,
        registrations: registrations.length,
        active: registrations.some(r => r.active)
      };
    } else {
      info.serviceWorker = { available: false };
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={runDiagnostics}
          className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Ejecutar Diagnóstico
        </button>
        
        {Object.keys(debugInfo).length > 0 && (
          <div className="text-xs">
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
