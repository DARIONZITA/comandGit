# Teste manual: Matchmaking atômico (RPC)

Objetivo: garantir que apenas UMA partida é criada quando dois usuários entram na fila e que as entradas da fila são removidas corretamente.

Pré-requisitos:
- Dois usuários autenticados (A e B), cada um em um navegador diferente ou sessão anônima diferente.
- Supabase migrado com a função `create_match_and_mark_queue` aplicada.
- App rodando localmente.

Passos:
1) Usuário A entra em /multiplayer.
   - Deve ver a tela de “Procurando Oponente”.
   - Verifique no banco: `select * from multiplayer_queue where user_id = '<A>'` → 1 linha com status 'waiting'.

2) Usuário B entra em /multiplayer.
   - Em até 1-2s ambos devem ir para a tela “Oponente Encontrado!”.
   - Verifique no banco:
     - `select * from multiplayer_matches where (player1_id = '<A>' and player2_id = '<B>') or (player1_id = '<B>' and player2_id = '<A>')` → EXISTE 1 partida, status 'waiting'.
     - `select * from multiplayer_queue where user_id in ('<A>','<B>')` → 0 linhas (ambas removidas pela RPC).

3) Atualize rapidamente os dois navegadores (simular corrida).
   - Não deve criar segunda partida. A consulta acima continua retornando apenas 1 linha.

4) Tela de “Estou Pronto!”. Clique em Estou Pronto em A e depois em B.
   - Partida deve mudar para status 'active' e started_at preenchido.

5) Cancelar (opcional): antes de clicar “Estou Pronto!”, clique “Cancelar Partida”.
   - Você deve voltar ao menu e sua fila continuar vazia: `select * from multiplayer_queue where user_id = '<A>'` → 0.

Observações:
- O fallback de polling é de 2s. Em redes lentas, aguarde até 2s.
- Logs do servidor devem mostrar a criação única da partida.
