import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheckIcon, 
  ArrowPathIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const TwoFactorAuth = ({ userId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryKeys, setRecoveryKeys] = useState([]);
  const [showRecoveryKeys, setShowRecoveryKeys] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, [userId]);

  // Verificar si el usuario tiene 2FA habilitado
  const checkTwoFactorStatus = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error al verificar estado 2FA:', error);
        toast.error('Error al verificar estado de autenticación de dos factores');
        return;
      }
      
      setIs2FAEnabled(!!data && data.enabled);
    } catch (error) {
      console.error('Error al verificar 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar configuración de 2FA
  const startSetup = async () => {
    try {
      setLoading(true);
      
      // Generar secreto TOTP
      const response = await fetch('/api/generate-totp-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Error al generar secreto TOTP');
      }
      
      const data = await response.json();
      
      // Guardar secreto y URL para código QR
      setSecret(data.secret);
      setQrCodeUrl(data.otpauth_url);
      
      // Generar claves de recuperación
      const recoveryKeys = [];
      for (let i = 0; i < 10; i++) {
        recoveryKeys.push(generateRecoveryKey());
      }
      setRecoveryKeys(recoveryKeys);
      
      // Activar modo de configuración
      setSetupMode(true);
    } catch (error) {
      console.error('Error al iniciar configuración 2FA:', error);
      toast.error('Error al iniciar la configuración de autenticación de dos factores');
    } finally {
      setLoading(false);
    }
  };

  // Generar clave de recuperación aleatoria
  const generateRecoveryKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    // Generar 4 grupos de 5 caracteres (XXXXX-XXXXX-XXXXX-XXXXX)
    for (let group = 0; group < 4; group++) {
      for (let i = 0; i < 5; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (group < 3) key += '-';
    }
    
    return key;
  };

  // Verificar código TOTP
  const verifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa un código de verificación válido de 6 dígitos');
      return;
    }
    
    try {
      setVerifying(true);
      
      // Verificar código TOTP
      const response = await fetch('/api/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          secret,
          token: verificationCode,
          recoveryKeys
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar código TOTP');
      }
      
      const data = await response.json();
      
      if (data.verified) {
        toast.success('Autenticación de dos factores activada correctamente');
        setIs2FAEnabled(true);
        setSetupMode(false);
        setShowRecoveryKeys(true);
        
        // Registrar en auditoría
        await supabase.rpc('log_action', {
          p_accion: 'activar_2fa',
          p_tabla: 'usuarios',
          p_registro_id: userId,
          p_detalles: { metodo: 'TOTP' }
        });
        
        if (onComplete) {
          onComplete(true);
        }
      } else {
        toast.error('Código de verificación incorrecto. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al verificar código TOTP:', error);
      toast.error('Error al verificar el código');
    } finally {
      setVerifying(false);
    }
  };

  // Desactivar 2FA
  const disable2FA = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto reducirá la seguridad de tu cuenta.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('two_factor_auth')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Registrar en auditoría
      await supabase.rpc('log_action', {
        p_accion: 'desactivar_2fa',
        p_tabla: 'usuarios',
        p_registro_id: userId,
        p_detalles: { metodo: 'TOTP' }
      });
      
      toast.success('Autenticación de dos factores desactivada');
      setIs2FAEnabled(false);
      
      if (onComplete) {
        onComplete(false);
      }
    } catch (error) {
      console.error('Error al desactivar 2FA:', error);
      toast.error('Error al desactivar la autenticación de dos factores');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar configuración
  const cancelSetup = () => {
    setSetupMode(false);
    setSecret('');
    setQrCodeUrl('');
    setVerificationCode('');
    setRecoveryKeys([]);
  };

  // Copiar claves de recuperación al portapapeles
  const copyRecoveryKeys = () => {
    const keysText = recoveryKeys.join('\n');
    navigator.clipboard.writeText(keysText);
    toast.success('Claves de recuperación copiadas al portapapeles');
  };

  // Descargar claves de recuperación como archivo de texto
  const downloadRecoveryKeys = () => {
    const keysText = 'CLAVES DE RECUPERACIÓN - Aisla Partes\n\n' +
      'Guarda estas claves en un lugar seguro. Cada clave solo puede usarse una vez.\n\n' +
      recoveryKeys.join('\n');
    
    const blob = new Blob([keysText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claves-recuperacion-aisla.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (showRecoveryKeys) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
            Claves de Recuperación
          </h3>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>¡IMPORTANTE!</strong> Guarda estas claves de recuperación en un lugar seguro.
                Si pierdes acceso a tu aplicación de autenticación, necesitarás una de estas claves para acceder a tu cuenta.
                Cada clave solo puede usarse una vez.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4 font-mono text-sm">
          {recoveryKeys.map((key, index) => (
            <div key={index} className="py-1">
              {index + 1}. {key}
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copyRecoveryKeys}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Copiar Claves
          </button>
          
          <button
            onClick={downloadRecoveryKeys}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Descargar Claves
          </button>
          
          <button
            onClick={() => setShowRecoveryKeys(false)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-auto"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Configurar Autenticación de Dos Factores
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">Paso 1: Escanea el código QR</h4>
            <p className="text-sm text-gray-600 mb-4">
              Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Microsoft Authenticator, Authy, etc.).
            </p>
            
            <div className="flex justify-center mb-4">
              {qrCodeUrl && (
                <div className="p-2 bg-white rounded-md inline-block">
                  <QRCodeSVG value={qrCodeUrl} size={200} />
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-700 mb-1">Si no puedes escanear el código, ingresa esta clave manualmente:</p>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                {secret}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">Paso 2: Ingresa el código de verificación</h4>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación.
            </p>
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                className="w-36 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-center text-lg"
                maxLength={6}
              />
              
              <button
                onClick={verifyTOTP}
                disabled={verifying || verificationCode.length !== 6}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {verifying && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                Verificar
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={cancelSetup}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Autenticación de Dos Factores
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta. Además de tu contraseña, 
        necesitarás un código generado por una aplicación de autenticación para iniciar sesión.
      </p>
      
      <div className={`p-4 rounded-md mb-6 ${is2FAEnabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {is2FAEnabled ? (
              <ShieldCheckIcon className="h-5 w-5 text-green-400" />
            ) : (
              <LockClosedIcon className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Estado: {is2FAEnabled ? 'Activado' : 'Desactivado'}
            </h3>
            <div className="mt-2 text-sm">
              <p className={is2FAEnabled ? 'text-green-700' : 'text-yellow-700'}>
                {is2FAEnabled 
                  ? 'Tu cuenta está protegida con autenticación de dos factores.' 
                  : 'Tu cuenta no está protegida con autenticación de dos factores. Recomendamos activarla para mayor seguridad.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        {is2FAEnabled ? (
          <button
            onClick={disable2FA}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Desactivar 2FA
          </button>
        ) : (
          <button
            onClick={startSetup}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Activar 2FA
          </button>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
