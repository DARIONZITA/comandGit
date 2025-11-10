/**
 * Script para verificar variáveis dinâmicas no Supabase
 * Execute: node check_variables.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zjahqoudwupxbbaemvuq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVariables() {
  console.log('🔍 Verificando variáveis dinâmicas no Supabase...\n');
  console.log(`📡 URL: ${supabaseUrl}\n`);

  try {
    const { data: variables, error } = await supabase
      .from('dynamic_variables')
      .select('*');

    if (error) {
      console.error('❌ Erro ao buscar variáveis:', error);
      return;
    }

    if (!variables || variables.length === 0) {
      console.warn('⚠️ Nenhuma variável encontrada na tabela dynamic_variables!');
      console.log('\n💡 Você precisa inserir variáveis. Exemplo:');
      console.log(`
INSERT INTO dynamic_variables (variable_name, value_pool, description) VALUES
('[FILE_NAME]', '["app.js", "index.html", "style.css", "config.json"]'::jsonb, 'Nomes de arquivos comuns'),
('[COMMIT_MSG]', '["feat: login", "fix: bug na API", "docs: atualiza README"]'::jsonb, 'Mensagens de commit');
      `);
      return;
    }

    console.log(`✅ Encontradas ${variables.length} variáveis:\n`);

    variables.forEach((variable, index) => {
      console.log(`${index + 1}. ${variable.variable_name}`);
      console.log(`   Descrição: ${variable.description || 'N/A'}`);
      console.log(`   Tipo do value_pool: ${typeof variable.value_pool}`);
      
      let pool = [];
      if (typeof variable.value_pool === 'string') {
        try {
          pool = JSON.parse(variable.value_pool);
        } catch (e) {
          console.log(`   ❌ Erro ao fazer parse do JSON: ${e.message}`);
          pool = [];
        }
      } else if (Array.isArray(variable.value_pool)) {
        pool = variable.value_pool;
      } else {
        console.log(`   ⚠️ Tipo desconhecido: ${typeof variable.value_pool}`);
      }
      
      console.log(`   Valores (${pool.length}):`, pool);
      console.log('');
    });

    // Verificar se há variáveis esperadas
    const expectedVars = ['[FILE_NAME]', '[COMMIT_MSG]'];
    const foundVars = variables.map(v => v.variable_name);
    
    console.log('\n📋 Verificação de variáveis esperadas:');
    expectedVars.forEach(expected => {
      if (foundVars.includes(expected)) {
        console.log(`   ✅ ${expected} encontrada`);
      } else {
        console.log(`   ❌ ${expected} NÃO encontrada`);
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkVariables();


