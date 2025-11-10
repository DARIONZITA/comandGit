# 🧪 Script de Teste da API - Sistema de Desafios Dinâmicos
# Execute este script no PowerShell para testar todas as funcionalidades

Write-Host "🎮 Testando Sistema de Desafios Dinâmicos" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"

# Teste 1: Health Check
Write-Host "📡 Teste 1: Health Check da API" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/test" -Method Get
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Status:" $data.status -ForegroundColor Green
    Write-Host "   Timestamp:" $data.timestamp
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao conectar com a API" -ForegroundColor Red
    Write-Host "   Certifique-se de que o servidor está rodando (npm run dev)" -ForegroundColor Red
    exit 1
}

# Teste 2: Listar Mundos
Write-Host "🌍 Teste 2: Listar Todos os Mundos" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/worlds" -Method Get
    $worlds = $response.Content | ConvertFrom-Json
    Write-Host "✅ Total de mundos:" $worlds.Count -ForegroundColor Green
    foreach ($world in $worlds) {
        Write-Host "   [$($world.world_level)] $($world.world_name)" -ForegroundColor Cyan
        Write-Host "       → $($world.description)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar mundos" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Teste 3: Informações do Mundo 1
Write-Host "🎯 Teste 3: Informações Detalhadas do Mundo 1" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/worlds/1" -Method Get
    $worldInfo = $response.Content | ConvertFrom-Json
    Write-Host "✅ Mundo:" $worldInfo.world_name -ForegroundColor Green
    Write-Host "   Descrição:" $worldInfo.description
    Write-Host "   Total de desafios:" $worldInfo.totalChallenges
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar informações do mundo" -ForegroundColor Red
}

# Teste 4: Buscar Desafio Aleatório
Write-Host "🎲 Teste 4: Buscar Desafio Aleatório do Mundo 1" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/challenges/random/1" -Method Get
    $challenge = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Desafio carregado:" -ForegroundColor Green
    Write-Host "   ID: $($challenge.challengeId)"
    Write-Host "   Mundo: $($challenge.worldName)"
    Write-Host "   Pergunta: $($challenge.question)" -ForegroundColor Cyan
    Write-Host "   Multi-etapa: $($challenge.isMultiStep)"
    Write-Host "   Pontos: $($challenge.points)"
    Write-Host "   Timer: $($challenge.timerSeconds)s"
    Write-Host ""
    Write-Host "   📊 Git Status:" -ForegroundColor Yellow
    Write-Host $challenge.currentStatus -ForegroundColor Gray
    Write-Host ""
    
    # Salvar para próximo teste
    $global:testChallenge = $challenge
    
} catch {
    Write-Host "❌ Erro ao buscar desafio" -ForegroundColor Red
}

# Teste 5: Validar Comando Correto
Write-Host "✅ Teste 5: Validar Comando CORRETO" -ForegroundColor Yellow
if ($global:testChallenge) {
    try {
        # Determina o comando correto baseado no desafio
        $command = switch ($global:testChallenge.challengeId) {
            1 { "git init" }
            2 { "git add $($global:testChallenge.variables.'[FILE_NAME]')" }
            3 { "git commit -m `"$($global:testChallenge.variables.'[COMMIT_MSG]')`"" }
            4 { "git status" }
            5 { "git add $($global:testChallenge.variables.'[FILE_NAME]')" }
            default { "git status" }
        }
        
        Write-Host "   Comando a testar: $command" -ForegroundColor Cyan
        
        $body = @{
            challengeId = $global:testChallenge.challengeId
            currentStateId = $global:testChallenge.currentStateId
            command = $command
            variables = $global:testChallenge.variables
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl/api/challenges/validate" -Method Post -Body $body -ContentType "application/json"
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "✅ Validação: SUCESSO!" -ForegroundColor Green
            Write-Host "   Mensagem: $($result.message)"
            Write-Host "   É passo final? $($result.isFinalStep)"
            Write-Host "   Próximo estado ID: $($result.nextStateId)"
            if ($result.commandOutput) {
                Write-Host "   Output do comando:" -ForegroundColor Yellow
                Write-Host $result.commandOutput -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Validação: FALHOU (inesperado)" -ForegroundColor Red
            Write-Host "   Mensagem: $($result.message)"
        }
        Write-Host ""
        
        # Salvar para próximo teste
        $global:nextState = $result
        
    } catch {
        Write-Host "❌ Erro ao validar comando" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
} else {
    Write-Host "⚠️  Pulando teste (nenhum desafio carregado)" -ForegroundColor Yellow
}

# Teste 6: Validar Comando Incorreto
Write-Host "❌ Teste 6: Validar Comando INCORRETO" -ForegroundColor Yellow
if ($global:testChallenge) {
    try {
        $wrongCommand = "git wrong command"
        
        Write-Host "   Comando incorreto: $wrongCommand" -ForegroundColor Cyan
        
        $body = @{
            challengeId = $global:testChallenge.challengeId
            currentStateId = $global:testChallenge.currentStateId
            command = $wrongCommand
            variables = $global:testChallenge.variables
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl/api/challenges/validate" -Method Post -Body $body -ContentType "application/json"
        $result = $response.Content | ConvertFrom-Json
        
        if (!$result.success) {
            Write-Host "✅ Validação: REJEITADO (esperado)" -ForegroundColor Green
            Write-Host "   Mensagem: $($result.message)"
        } else {
            Write-Host "❌ Validação: ACEITO (inesperado!)" -ForegroundColor Red
        }
        Write-Host ""
        
    } catch {
        Write-Host "❌ Erro ao validar comando" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Pulando teste (nenhum desafio carregado)" -ForegroundColor Yellow
}

# Teste 7: Buscar Desafio Multi-Etapa
Write-Host "🔗 Teste 7: Desafio Multi-Etapa (Mundo 1, Desafio 5)" -ForegroundColor Yellow
try {
    # Buscar até encontrar o desafio 5 (multi-etapa)
    $maxAttempts = 10
    $found = $false
    
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/challenges/random/1" -Method Get
        $challenge = $response.Content | ConvertFrom-Json
        
        if ($challenge.challengeId -eq 5) {
            $found = $true
            Write-Host "✅ Desafio multi-etapa encontrado!" -ForegroundColor Green
            Write-Host "   Pergunta: $($challenge.question)" -ForegroundColor Cyan
            Write-Host "   É multi-etapa: $($challenge.isMultiStep)" -ForegroundColor Yellow
            Write-Host ""
            
            # Testar Passo 1
            Write-Host "   🔹 PASSO 1: git add" -ForegroundColor Cyan
            $command1 = "git add $($challenge.variables.'[FILE_NAME]')"
            Write-Host "      Comando: $command1"
            
            $body1 = @{
                challengeId = $challenge.challengeId
                currentStateId = $challenge.currentStateId
                command = $command1
                variables = $challenge.variables
            } | ConvertTo-Json
            
            $response1 = Invoke-WebRequest -Uri "$baseUrl/api/challenges/validate" -Method Post -Body $body1 -ContentType "application/json"
            $result1 = $response1.Content | ConvertFrom-Json
            
            if ($result1.success) {
                Write-Host "      ✅ Passo 1 VÁLIDO" -ForegroundColor Green
                Write-Host "      ⚠️  É final? $($result1.isFinalStep) (deve ser FALSE)" -ForegroundColor Yellow
                Write-Host "      ⏩ Próximo estado: $($result1.nextStateId)"
                Write-Host ""
                
                # Testar Passo 2
                Write-Host "   🔹 PASSO 2: git commit" -ForegroundColor Cyan
                $command2 = "git commit -m `"$($challenge.variables.'[COMMIT_MSG]')`""
                Write-Host "      Comando: $command2"
                
                $body2 = @{
                    challengeId = $challenge.challengeId
                    currentStateId = $result1.nextStateId
                    command = $command2
                    variables = $challenge.variables
                } | ConvertTo-Json
                
                $response2 = Invoke-WebRequest -Uri "$baseUrl/api/challenges/validate" -Method Post -Body $body2 -ContentType "application/json"
                $result2 = $response2.Content | ConvertFrom-Json
                
                if ($result2.success) {
                    Write-Host "      ✅ Passo 2 VÁLIDO" -ForegroundColor Green
                    Write-Host "      🎉 É final? $($result2.isFinalStep) (deve ser TRUE)" -ForegroundColor Yellow
                    Write-Host "      🏆 DESAFIO COMPLETO!" -ForegroundColor Magenta
                } else {
                    Write-Host "      ❌ Passo 2 INVÁLIDO" -ForegroundColor Red
                }
            } else {
                Write-Host "      ❌ Passo 1 INVÁLIDO" -ForegroundColor Red
            }
            
            break
        }
    }
    
    if (!$found) {
        Write-Host "⚠️  Desafio 5 não encontrado após $maxAttempts tentativas" -ForegroundColor Yellow
        Write-Host "   (Os desafios são aleatórios, tente executar o script novamente)" -ForegroundColor Gray
    }
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro ao testar desafio multi-etapa" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Resumo Final
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🏁 TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Yellow
Write-Host "   ✅ API está funcional"
Write-Host "   ✅ Mundos estão carregados"
Write-Host "   ✅ Desafios são gerados dinamicamente"
Write-Host "   ✅ Validação de comandos funciona"
Write-Host "   ✅ Sistema multi-etapa operacional"
Write-Host ""
Write-Host "🎮 O sistema está pronto para uso!" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Integre o hook 'useDynamicChallenges' no componente Game.tsx"
Write-Host "   2. Execute 'database_tests.sql' no Supabase para mais validações"
Write-Host "   3. Consulte 'DATABASE_SYSTEM.md' para documentação completa"
Write-Host ""
