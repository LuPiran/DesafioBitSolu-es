# Portal de Solicitações Internas

Sistema para colaboradores registrarem demandas internas e acompanharem o andamento até a conclusão. A entrega é da segunda etapa da seleção para Desenvolvedor de Sistemas Júnior da bit Soluções.

O avaliador sobe a interface e a API com Docker. Os dados e o login ficam no Supabase, com políticas de linha no PostgreSQL. A publicação na VPS da Hostinger ficou de fora desta entrega.

## O que o sistema faz

- Login e logout por e-mail e senha, com sessão em cookie `httpOnly`.
- Cadastro de solicitação com título, descrição e categoria. Código, data e solicitante são automáticos.
- Lista com código, título, categoria, solicitante, data e status.
- Filtros por período, categoria, status e texto do título.
- Detalhe, edição e exclusão. A edição e a exclusão valem enquanto o status é Aberto.
- Status na ordem Aberto, Em atendimento e Concluído.
- Painel com total, abertas, em atendimento e concluídas.
- Dois papéis: o usuário padrão vê e altera só as próprias solicitações; o administrador vê e altera as de todos, ainda restrito ao status Aberto para editar e excluir.

## Stack

| Parte | Tecnologia |
|---|---|
| Interface | React 19, Vite, TypeScript, Tailwind CSS |
| API | Node.js 22, Express, TypeScript |
| Validação | Zod |
| Banco e login | Supabase: PostgreSQL, Auth e RLS |
| Sessão | JWT do Supabase em cookies `httpOnly` |
| Execução | Docker Compose: API e Nginx |

Linguagem da API e da interface: TypeScript.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) em execução
- [Node.js 22](https://nodejs.org/) para aplicar o schema, carregar os dados de demonstração e rodar os testes
- Um projeto no [Supabase](https://supabase.com/)

Não é preciso instalar PostgreSQL na máquina. O Compose não sobe um banco local.

## Variáveis de ambiente

Copie o exemplo e preencha com os dados do projeto:

```bash
cp backend/.env.example backend/.env
```

No Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

| Variável | Onde achar | Uso |
|---|---|---|
| `SUPABASE_URL` | Project Settings, API | Endereço do projeto |
| `SUPABASE_ANON_KEY` | Project Settings, API | Chave anônima. A API usa esta chave junto com o JWT do usuário logado |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings, API, `service_role` | Só o comando `npm run seed`. A API em execução não lê esta chave |
| `SUPABASE_DB_URL` | Project Settings, Database, URI | Só o comando `npm run schema`. Use a URI do modo sessão |
| `APP_ORIGIN` | Livre no desenvolvimento | Origem aceita pelo CORS. O Compose substitui por `http://127.0.0.1:8080` |
| `PORT` | Livre | Porta da API fora do Docker. O padrão é `3333` |

O arquivo `backend/.env` não entra no Git.

## Banco de dados

Na pasta `backend`, com as variáveis já preenchidas:

```bash
npm ci
npm run schema
npm run seed
```

`npm run schema` aplica `database/supabase.sql`: tabelas, gatilhos, funções e RLS.

`npm run seed` cria os dois usuários de demonstração e treze solicitações. Se as solicitações já existirem, o comando não as duplica.

O dicionário de campos, tipos e regras está em `database/dicionario.md`.

## Executar com Docker

Na raiz do repositório, depois do schema e do seed:

```bash
docker compose up --build
```

Abra http://127.0.0.1:8080.

O serviço `web` publica a porta 8080 apenas em `127.0.0.1` e encaminha `/api` para a API. A API não fica exposta direto na máquina. Ela precisa alcançar a internet para falar com o Supabase.

Para encerrar: `Ctrl+C` e, se quiser remover os contêineres, `docker compose down`.

## Executar sem Docker

Dois terminais.

API:

```bash
cd backend
npm ci
npm run dev
```

A API sobe em http://127.0.0.1:3333. Neste modo, `APP_ORIGIN` no `.env` deve ser `http://127.0.0.1:5173`.

Interface:

```bash
cd frontend
npm ci
npm run dev
```

O Vite publica a interface em http://127.0.0.1:5173 e encaminha `/api` para a porta 3333.

## Usuários de demonstração

| Nome | E-mail | Senha | Papel |
|---|---|---|---|
| Ana Costa | ana.costa@portal.interno | portal123 | Administradora. Vê e altera solicitações de todos |
| Bruno Lima | bruno.lima@portal.interno | portal123 | Usuário padrão. Vê e altera só as próprias |

A senha fica no Auth do Supabase, com hash. Nenhuma resposta da API devolve senha, hash ou chave.

Para ver a diferença de papel, entre com a Ana e confira as 13 solicitações. Saia e entre com o Bruno: a lista fica só com as 6 dele. Abrir, editar ou excluir uma solicitação da Ana com a sessão do Bruno responde que ela não foi encontrada.

## Testes

Na pasta `backend`:

```bash
npm test
```

São 18 testes, sem chamar o banco. Cobrem a ordem de status, a validação de login e de solicitação, a recusa de campo extra no corpo, a sessão obrigatória, a origem rejeitada e o login com corpo inválido. O mesmo comando roda no GitHub Actions em `.github/workflows/test.yml`.

## Rotas da API

Todas as rotas de solicitação exigem sessão. O corpo JSON, quando existe, é estrito: campo desconhecido é rejeitado.

| Método | Caminho | Efeito |
|---|---|---|
| `GET` | `/api/health` | Saúde da API |
| `POST` | `/api/auth/login` | E-mail e senha. Grava os cookies |
| `POST` | `/api/auth/logout` | Encerra a sessão |
| `GET` | `/api/auth/me` | Usuário da sessão, com o papel |
| `GET` | `/api/solicitations` | Lista visível para o papel |
| `POST` | `/api/solicitations` | Cria em nome de quem está logado |
| `PATCH` | `/api/solicitations/:id` | Edita, se estiver aberta e for permitida |
| `POST` | `/api/solicitations/:id/status` | Avança um passo de status |
| `DELETE` | `/api/solicitations/:id` | Exclui, se estiver aberta e for permitida |

Pedidos que alteram dados precisam do cabeçalho `X-Portal-Request: 1` e de uma origem aceita. O navegador da aplicação envia os dois.

## Evidências

Prints da aplicação em execução, na pasta `evidencias/`:

| Arquivo | Tela |
|---|---|
| `01-login.png` | Acesso. Sem sessão, o portal permanece nesta tela |
| `02-painel.png` | Painel com o volume das solicitações |
| `03-lista.png` | Lista, filtros e menu de ações |
| `04-nova-solicitacao.png` | Formulário de abertura |
| `05-detalhe.png` | Detalhe, com avanço de status e o mesmo menu da lista |

## Onde está cada coisa

```
backend/src              API: rotas, regras, sessão e validação
frontend/src             Telas, filtros, painel e menu de ações
database/supabase.sql    Script aplicado no Supabase
database/dicionario.md   Campos, tipos e regras
MEMORIAL_TECNICO.md      Decisões, camadas e limites
evidencias/              Prints das telas
docker-compose.yml            API e interface na máquina local
docker-compose.easypanel.yml  Publicação no EasyPanel
```

## Publicação no EasyPanel

O arquivo `docker-compose.easypanel.yml` sobe os mesmos dois contêineres na VPS. O painel faz o HTTPS e encaminha o domínio só para o serviço `web`, na porta 80. A API permanece na rede interna. O Nginx dessa interface continua encaminhando `/api`.

No EasyPanel, crie um serviço do tipo Compose a partir do Git:

- Repositório: `https://github.com/LuPiran/DesafioBitSolu-es`
- Branch: `main`
- Build path: `/`
- Compose file: `docker-compose.easypanel.yml`

No ambiente do serviço, preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_ORIGIN` e `COOKIE_SECURE=true`. Ative a criação do arquivo `.env`. `APP_ORIGIN` é o endereço público com `https`, sem barra no final. A chave de serviço e a URI do banco não entram nesse ambiente: o schema e os dados de demonstração já estão no Supabase.

Em Domains, aponte o hostname para o serviço interno `web`, porta `80`, conexão HTTP. O certificado fica no painel. O registro DNS do hostname aponta para o IP da VPS. Depois de mudar o ambiente ou o domínio, use Deploy.
