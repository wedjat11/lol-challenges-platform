'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/ui/Navbar';
import { apiClient } from '@/lib/api';

export default function LinkRiotAccountPage() {
  const router = useRouter();
  const { setHasRiotAccount } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [riotTag, setRiotTag] = useState('');
  const [region, setRegion] = useState('LA1');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!riotTag) {
      setError('Por favor ingresa tu etiqueta de Riot');
      return;
    }

    const parts = riotTag.split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Formato inválido. Usa: NOMBRE#TAG (ej: TOTO#LAN)');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/users/me/riot-account', {
        gameName: parts[0],
        tagLine: parts[1],
        region,
      });

      setHasRiotAccount(true);
      showToast('¡Cuenta de LoL vinculada exitosamente!', 'success');
      router.push('/app/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al vincular la cuenta';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="glass-card w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Vincula tu Cuenta
            </h1>
            <p className="text-[#a0aec0] text-lg">
              Necesitamos tu cuenta de League of Legends para validar tus retos automáticamente
            </p>
          </div>

          <div className="bg-[#c89b3c]/10 border border-[#c89b3c]/30 rounded-lg p-4 mb-8">
            <p className="text-[#e0b652] text-sm">
              ℹ️ La validación es 100% automática vía Riot API. No guardamos contraseñas.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Riot Tag Input */}
            <div>
              <label className="label">Tu etiqueta de LoL</label>
              <input
                type="text"
                placeholder="NOMBRE#TAG (ej: TOTO#LAN)"
                value={riotTag}
                onChange={(e) => setRiotTag(e.target.value.toUpperCase())}
                className="input-base mb-2"
              />
              <p className="text-[#a0aec0] text-xs">
                Puedes encontrar tu etiqueta en tu perfil de LoL o en la app Riot
              </p>
              {error && <p className="error-text">{error}</p>}
            </div>

            {/* Region Selector */}
            <div className="mt-6">
              <label className="label">Región</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-base"
              >
                <option value="LA1">LA1 - Latin America North</option>
                <option value="LA2">LA2 - Latin America South</option>
                <option value="NA1">NA1 - North America</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-8"
            >
              {isLoading ? 'Vinculando...' : 'Vincular Cuenta'}
            </Button>

            {/* Skip Link */}
            <button
              type="button"
              onClick={handleSkip}
              className="w-full mt-4 text-[#a0aec0] hover:text-white transition-colors text-sm"
            >
              Hacerlo más tarde
            </button>
          </form>

          <div className="divider mt-8 mb-8" />

          <p className="text-center text-[#a0aec0] text-xs">
            Siempre puedes vincular tu cuenta después en tu perfil
          </p>
        </div>
      </div>
    </div>
  );
}
