// Cria, pela API, os usuários que os testes esperam encontrar já cadastrados.
// Idempotente: pode ser executado várias vezes sem erro.
// Uso: node scripts/create-test-users.js
// Requer Node 18+ (usa o fetch global).

// URL base da API; pode ser sobrescrita com a variável API_URL
const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/+$/, '');

// Usuários necessários; cada valor pode ser sobrescrito por variável de ambiente
const users = [
  {
    username: process.env.DEFAULT_USER_NAME || 'test',
    email: process.env.DEFAULT_USER_EMAIL || 'email@email.com',
    password: process.env.DEFAULT_USER_PASSWORD || '123456',
  },
  {
    username: process.env.CAROL_USER_NAME || 'carol',
    email: process.env.CAROL_USER_EMAIL || 'carol@teste.com',
    password: process.env.CAROL_USER_PASSWORD || '123456',
  },
];

// Registra um usuário e devolve 'criado' ou 'já existia'; lança erro em qualquer outro caso
async function createUser(user) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
  } catch (error) {
    // Falha de rede: servidor desligado, porta errada etc.
    throw new Error(`não foi possível acessar ${API_URL} (${error.cause?.code || error.message}). O back-end está rodando?`);
  }

  if (response.status === 201) return 'criado';
  // 422 = e-mail já cadastrado; para os testes isso equivale a sucesso
  if (response.status === 422) return 'já existia';

  // Qualquer outro status é falha; mostra só o status e o texto de erro, nunca o corpo completo (pode ter token)
  throw new Error(`resposta inesperada (HTTP ${response.status}) ao criar ${user.email}`);
}

async function main() {
  let falhas = 0;
  for (const user of users) {
    try {
      const resultado = await createUser(user);
      console.log(`[setup:users] ${user.email}: ${resultado}`);
    } catch (error) {
      falhas++;
      console.error(`[setup:users] ${user.email}: ERRO - ${error.message}`);
    }
  }
  // Código de saída diferente de zero interrompe o "npm run ... && cypress run"
  if (falhas > 0) process.exit(1);
}

main();
