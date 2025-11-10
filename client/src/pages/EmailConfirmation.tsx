import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { supabase } from '../lib/supabase';

export default function EmailConfirmation() {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Listen for email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLocation('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  const handleCheckEmail = async () => {
    setChecking(true);
    const { data } = await supabase.auth.getSession();
    
    if (data.session) {
      setLocation('/');
    } else {
      setTimeout(() => setChecking(false), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verifique seu Email</CardTitle>
          <CardDescription className="text-center">
            Enviamos um link de confirmação para o seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              📧 Por favor, verifique sua caixa de entrada e clique no link de confirmação.
              <br />
              <br />
              Após confirmar, você será automaticamente redirecionado ou pode clicar no botão abaixo.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleCheckEmail} 
            className="w-full"
            disabled={checking}
          >
            {checking ? 'Verificando...' : 'Já confirmei o email'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Não recebeu o email? </span>
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto"
              onClick={() => setLocation('/login')}
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
