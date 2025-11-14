import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(name, email, password);

    if (error) {
      console.error('Cadastro error:', error);
      if (error.message?.includes('not confirmed')) {
        setError('Verifique seu email para confirmar a conta antes de fazer login.');
      } else {
        setError(error?.message || 'Erro ao criar conta. Tente novamente.');
      }
      setLoading(false);
    } else {
      // Redireciona para página de confirmação de email
      setLocation('/email-confirmation');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4 mobile-padding">
      <Card className="w-full max-w-md mobile-modal-full">
        <CardHeader className="space-y-1 mobile-card-padding">
          <CardTitle className="text-2xl font-bold text-center mobile-text-xl">Cadastro</CardTitle>
          <CardDescription className="text-center mobile-text-base">
            Crie sua conta para começar
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
              <Label htmlFor="name" className="mobile-text-base">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="mobile-input-lg"
                required
              />
            </div>

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

            <div className="space-y-2 mobile-space-y-2">
              <Label htmlFor="confirmPassword" className="mobile-text-base">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="mobile-input-lg"
                required
              />
            </div>

            <Button type="submit" className="w-full mobile-btn-lg" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>

            <div className="text-center text-sm mobile-text-base">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto mobile-btn-lg"
                onClick={() => setLocation('/login')}
              >
                Faça login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
