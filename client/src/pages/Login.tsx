import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Login error:', error);
      if (error.message?.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError(error?.message || 'Email ou senha incorretos');
      }
      setLoading(false);
    } else {
      // Aguarda um pequeno delay para garantir que o AuthContext atualizou o estado
      setTimeout(() => {
        setLocation('/');
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 mobile-padding">
      <Card className="w-full max-w-md mobile-modal-full">
        <CardHeader className="space-y-1 mobile-card-padding">
          <CardTitle className="text-2xl font-bold text-center mobile-text-xl">Login</CardTitle>
          <CardDescription className="text-center mobile-text-base">
            Entre com seu email e senha
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-card-padding">
          <form onSubmit={handleSubmit} className="space-y-4 mobile-space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="mobile-text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 mobile-space-y-2">
              <Label htmlFor="email" className="mobile-text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mobile-input-lg"
                required
              />
            </div>

            <div className="space-y-2 mobile-space-y-2">
              <Label htmlFor="password" className="mobile-text-base">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mobile-input-lg"
                required
              />
            </div>

            <Button type="submit" className="w-full mobile-btn-lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm mobile-text-base">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto mobile-btn-lg"
                onClick={() => setLocation('/cadastro')}
              >
                Cadastre-se
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
