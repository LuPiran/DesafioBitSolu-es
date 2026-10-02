# Memorial técnico de desenvolvimento

Portal de Solicitações Internas, segunda etapa da seleção para Desenvolvedor de Sistemas Júnior da bit Soluções.

Este documento registra a estrutura da aplicação, a organização do código, a modelagem, a comunicação entre as partes, a autenticação, a validação e o motivo de cada tecnologia. No fim estão os limites da entrega e o que mudaria num ambiente corporativo.

## Estrutura geral

```
Navegador
  React, servido pelo Nginx
        |
        |  /api, cookie httpOnly, cabeçalho X-Portal-Request
        v
API Node (Express)
  valida, identifica a sessão e aplica a regra de papel
        |
        |  chave anônima + JWT do usuário
        v
Supabase
  Auth para login
  PostgreSQL com RLS para dados
```

O navegador não recebe a chave de serviço e não fala com o banco. A API é o único cliente do Supabase no fluxo normal. O Docker sobe duas peças: `web` e `api`. O banco não entra no Compose porque os dados estão no Supabase.

Há cinco telas: login, painel, lista com filtros, formulário de abertura ou edição, e detalhe. No detalhe e na lista, editar e excluir ficam no mesmo menu de três pontos.

## Organização das camadas

A API não usa um framework de módulos. A separação é por pasta, com dependência numa direção só.

| Pasta | Responsabilidade |
|---|---|
| `routes` | HTTP: método, status e formato da resposta. Não contém regra de negócio |
| `middleware` | Sessão, limite de tentativas, CORS prático e o cabeçalho próprio do portal |
| `services` | Lista, criação, edição, exclusão e avanço de status, já com o papel do ator |
| `lib` | Cliente do Supabase, cookies e erro HTTP |
| `domain.ts` | Categorias, status e a função que calcula o próximo status |
| `validators.ts` | Contratos Zod da entrada |

O serviço recebe um ator `{ id, role, accessToken }`. A rota tira esse ator da sessão. O serviço não lê `req`. Isso deixa a regra testável e impede que um controlador esqueça de filtrar a lista.

A interface segue o mesmo espírito. `pages` monta a tela, `components` guarda tabela, filtros, formulário e menu, `providers` guarda sessão e a lista vinda da API, `lib/api.ts` é o único lugar que chama `fetch`.

## Organização do código-fonte

```
backend/src
  app.ts                 Express, CORS, Helmet, JSON e tratamento de erro
  server.ts              Sobe a API depois de falar com o Auth
  config.ts              Variáveis obrigatórias
  domain.ts              Status e categorias
  validators.ts          Zod
  routes/auth.ts
  routes/solicitations.ts
  middleware/auth.ts     Cookie, refresh e perfil
  middleware/security.ts Limite e origem
  services/solicitations.ts
  seed.ts                Usuários e dados de demonstração
  apply-supabase.ts      Aplica database/supabase.sql

frontend/src
  pages                  Login, painel, lista, formulário, detalhe
  components/solicitacoes
  components/dashboard
  components/layout
  providers              Sessão e solicitações
  lib/api.ts             Cliente HTTP
```

O script `database/schema.sql` permanece no repositório como registro do modelo em que a API guardava a senha. O script vigente é `database/supabase.sql`.

## Modelagem

Duas tabelas nossas e a tabela de autenticação do Supabase.

`profiles` é o colaborador: nome, usuário, e-mail e papel. O `id` é o mesmo de `auth.users`. O papel não é uma coluna que o usuário atualiza. Não há política de `update` para o papel `authenticated`, e um gatilho recusa a mutação quando a sessão tem `auth.uid()`.

`solicitations` guarda a demanda. Categoria e status são textos com `check`, não tabelas auxiliares. O conjunto é pequeno e fechado. Repeti-lo no Zod e no banco faz as duas pontas rejeitarem o mesmo valor inválido sem uma ida extra ao banco para descobrir se a categoria existe.

O código `SOL-0001` nasce numa sequência. O cliente não escolhe o número. O gatilho de inclusão, quando a sessão é de um usuário, troca o código, força o solicitante para `auth.uid()` e grava o status Aberto. A sequência não é concedida ao papel do usuário: só a função do gatilho, com `security definer`, avança o contador.

A decisão de papel ficou assim:

- Usuário padrão lista, abre, edita, exclui e avança status apenas das próprias solicitações.
- Administrador faz o mesmo sobre todas.
- Editar conteúdo e excluir, para os dois papéis, só com status Aberto.
- Status não regride e não pula etapa.

O enunciado pedia apenas que usuários anônimos ficassem de fora. A separação entre autor e administrador foi acrescentada para o portal refletir um uso interno real e para o controle de objeto (IDOR) ter um critério explícito.

O dicionário completo está em `database/dicionario.md`.

## Comunicação entre frontend e backend

A interface chama caminhos relativos `/api/...` com `credentials: "same-origin"`. No Docker, o Nginx encaminha esse prefixo para o contêiner da API. No Vite, o proxy faz o mesmo para `127.0.0.1:3333`. O navegador enxerga uma origem só, então o cookie de sessão não depende de CORS entre portas.

Pedidos que mudam estado enviam `X-Portal-Request: 1`. Um site de outra origem não consegue fazer o navegador da vítima incluir esse cabeçalho num formulário simples. Somado ao cookie `SameSite=Lax` e à lista de origens, isso reduz CSRF.

O corpo é JSON de no máximo 32 KB. A resposta de erro é `{ message }`, com status HTTP. Em produção a API não devolve pilha.

A lista é a fonte da tela de detalhe e do painel. Como a API já tirou as linhas que o papel não pode ver, o detalhe de um id alheio não tem dado para mostrar e volta para a lista. O bloqueio verdadeiro está no servidor: um `PATCH` direto no id de outra pessoa recebe 404, não 403, para não confirmar que o registro existe.

## Autenticação

O login é `signInWithPassword` no Supabase Auth. A API guarda o access token e o refresh token em cookies `httpOnly`, `SameSite=Lax` e `Path=/`. O JavaScript da página não lê esses cookies. `Secure` fica desligado no endereço local em HTTP e deve ser ligado quando houver HTTPS.

Cada pedido protegido chama `auth.getUser` com o access token. Esse método confere o token com o Auth. Não basta decodificar o JWT no processo. Se o access token expirou e o refresh ainda vale, a API renova os cookies e segue. No logout, a API revoga a sessão no Auth e apaga os cookies.

O papel lido pela aplicação vem de `profiles.role`, não de um campo enviado pelo navegador. O objeto `app_metadata` do Auth também guarda o papel, e só a chave de serviço escreve nele. As políticas SQL usam `is_admin()`, que lê o perfil com `search_path` fixo, para um usuário não trocar o esquema e desviar a função.

A chave de serviço não é exportada pela configuração da API. O processo que atende HTTP usa a chave anônima e o JWT de quem está logado. Com isso o RLS continua valendo mesmo se uma consulta da API esquecer o filtro por autor. O filtro na aplicação existe mesmo assim: se uma política for aberta por engano, o usuário padrão continua restrito ao próprio `requester_id`.

Limites: oito tentativas de login a cada quinze minutos, sem contar o acerto, e 120 pedidos por minuto na API. A mensagem de login inválido é única. Não diz se o e-mail existe.

## Validação

Zod na borda da API, `check` e gatilhos no banco, e uma conferência curta no formulário para o aviso aparecer antes do pedido.

O corpo de login e o rascunho da solicitação são objetos estritos. `requesterId`, `role` ou `status` enviados pelo cliente são rejeitados. O identificador da URL tem de ser UUID. Título, descrição e categoria têm tamanho e conjunto iguais aos do banco.

Os testes em `backend/src/*.test.ts` fixam essa borda: status que não volta, categoria fora da lista, corpo com campo extra, sessão ausente, origem estranha e login malformado. Eles não dependem do projeto Supabase. `npm test` roda no GitHub Actions.

## Tecnologias

### TypeScript na API e na interface

Motivo: o contrato da solicitação e do usuário aparece no compilador. Um papel novo ou um status escrito errado quebra o build.

Benefício: menos defeito de campo trocado entre a lista e o formulário.

Alternativa: JavaScript puro seria mais rápido de começar e é o que o planejamento original previa. O custo aparece na hora de passar o papel e o identificador por várias camadas. TypeScript segurou essa mudança sem uma segunda linguagem.

Impacto: a manutenção do contrato fica no próprio código, não num documento separado que envelhece.

### React e Vite

Motivo: as telas compartilham sessão, lista e o menu de ações. React organiza esse estado. Vite entrega o desenvolvimento com proxy e o build estático que o Nginx serve.

Benefício: o detalhe, a lista e o painel leem a mesma lista já filtrada. Não há uma segunda fonte de dados no navegador.

Alternativa: páginas só com HTML pediriam a lista de novo em cada tela e espalhariam a regra de “não mostrar o que não é meu”. Um framework maior, como Next.js, acrescentaria servidor de interface que esta entrega não usa.

Impacto: o build é um diretório estático. Escalar a interface é servir esse diretório, não manter um processo Node para cada página.

### Tailwind CSS

Motivo: o layout responsivo da lista, dos filtros e do formulário fica junto do componente, com a mesma escala de cor do tema claro e escuro.

Benefício: a tabela vira cartão em tela estreita sem uma segunda folha de estilo.

Alternativa: CSS escrito à mão daria o mesmo resultado visual com mais arquivo para manter. Uma biblioteca de componentes pronta aceleraria, e foi usada por baixo (Radix) só onde o comportamento de select, diálogo e menu já está resolvido.

Impacto: mudar espaçamento ou estado de foco não exige procurar um seletor global.

### Express

Motivo: a API é pequena. Rotas, cookie, limite e erro cabem num processo só, fácil de colocar atrás do Nginx.

Benefício: o avaliador lê o caminho do pedido sem um gerador de código no meio.

Alternativa: NestJS organizaria módulos com mais cerimônia do que o tamanho do domínio pede. Uma função única sem framework misturaria HTTP e regra.

Impacto: acrescentar uma rota é um arquivo em `routes` e uma função em `services`. O custo de escala é horizontal: mais de um processo atrás de um balanceador, sem afinidade de sessão, porque a sessão está no cookie e no Auth.

### Zod

Motivo: o corpo HTTP precisa falhar antes de chegar ao Supabase, com mensagem estável.

Benefício: objeto estrito impede que o cliente injete solicitante, papel ou status.

Alternativa: validar na mão espalha `if` e esquece o campo extra. Uma biblioteca de schema no banco não protege a borda HTTP.

Impacto: a regra de tamanho do título existe uma vez na API e outra no `check` do PostgreSQL. A duplicação é proposital: as duas falham fechadas.

### Supabase Auth e PostgreSQL

Motivo: o portal precisava de login, de banco SQL e de uma barreira que não dependesse só da memória do programador na hora do `select`. O Auth guarda a senha. O RLS aplica autor e administrador em toda leitura e escrita feita com o JWT do usuário.

Benefício: um token vazado de usuário padrão continua sem ver a linha do colega, porque o banco filtra. A API reforça o mesmo filtro.

Alternativa considerada no planejamento: PostgreSQL no Compose, bcrypt e JWT emitido pela API. Isso sobe com um comando e não pede conta externa. Foi o desenho inicial. A entrega ficou no Supabase porque o requisito passou a ser o banco e o login gerenciados, com RLS de verdade, e não um Postgres só na máquina de quem avalia. O custo é que `docker compose up` sozinho não cria o projeto: é preciso preencher o `.env`, aplicar o schema e rodar o seed.

Outra alternativa, RDS com Cognito, resolve o mesmo problema na AWS. Não foi montada. Exige conta, rede e custo contínuo para uma avaliação que precisa abrir o README e rodar. O desenho dessa opção está na seção de produção.

Impacto: a senha e a política de objeto não moram num único processo Node. Trocar a API não abre o dado. O ponto de operação passa a ser o projeto Supabase: backup, pausa e chave de serviço.

### Docker Compose e Nginx

Motivo: a interface e a API sobem juntas, com o proxy já configurado, na porta 8080.

Benefício: não há passo manual de “suba o Vite e depois a API” para quem só quer ver o portal.

Alternativa: publicar os dois processos direto no host funciona em desenvolvimento e é o que `npm run dev` faz. Para a entrega, o Compose evita diferença de porta e de versão do Node.

Impacto: a imagem da interface é estática. A imagem da API é o `node dist/server.js`. Nenhuma das duas contém o `.env` dentro do Git. O Compose lê `backend/.env` na hora de subir.

### Node.js test runner e Supertest

Motivo: os módulos são ESM e TypeScript. O executor nativo do Node 22 roda os arquivos com `tsx`, sem uma configuração paralela de Jest.

Benefício: os testes da borda HTTP sobem o mesmo `createApp()` da produção e não precisam de banco.

Alternativa: Jest é o nome mais comum e estava no planejamento como diferencial. Com ESM nativo ele pede uma camada extra de transformação. O resultado observável é o mesmo: `npm test` falha se a validação ou a sessão afrouxar.

Impacto: o workflow do GitHub Actions usa Node 22 e variáveis fictícias. Ele não usa a chave real do projeto. Quando esses testes passam num push da `main`, o mesmo workflow pede ao EasyPanel para publicar. O endereço desse pedido fica num segredo do GitHub, fora do repositório. Assim uma alteração que quebra a validação não chega no site que está no ar.

### react-icons

Motivo: o menu de ações pede ícones de lápis, lixeira e três pontos, num pacote só.

Benefício: a lista e o detalhe usam o mesmo componente de menu.

Alternativa: desenhar o SVG na mão, ou manter só a família Phosphor que o restante da interface já usa. Os ícones desse menu vieram do react-icons porque foi o pacote pedido para essa interação.

## Análise crítica

### Limitações

- Quem avalia precisa de um projeto Supabase e das quatro variáveis. Sem isso o Compose sobe, mas o login não tem banco.
- A chave de serviço fica no `.env` da máquina que roda o seed. Ela não é lida pela API, mas está no mesmo arquivo. Num time, esse valor iria para um cofre e o seed rodaria num passo de deploy, não no laptop.
- O detalhe não busca a solicitação por id numa rota `GET`. Ele usa a lista já carregada. Isso é seguro, porque a lista veio filtrada, e é limitado: um endereço aberto direto depende dessa lista estar na memória da sessão.
- Edição e exclusão continuam presas ao status Aberto, também para o administrador. O administrador não reabre uma solicitação concluída.
- Não há recuperação de senha, cadastro público nem trilha de auditoria além de `created_at` e `updated_at`.
- Os testes não sobem o Supabase. A política de linha foi exercitada à parte, contra o projeto real, e não faz parte do `npm test` para o Actions não depender de segredo.
- HTTPS local está desligado. `COOKIE_SECURE` só deve ficar `true` com TLS. No endereço público ele está ligado.

### Melhorias futuras

- Rota `GET /api/solicitations/:id` com o mesmo 404 do restante, para o detalhe não depender da lista em memória.
- Convite de usuário pela administração, em vez de criar a conta no seed.
- Histórico de quem avançou o status e quando.
- Teste de integração opcional, marcado para rodar só quando `SUPABASE_URL` real estiver presente.
- Paginação na API. Hoje a página de dez itens é feita no navegador sobre a lista inteira visível ao papel.

### Ambiente corporativo

O núcleo já é o de um banco e um login gerenciados. Em produção eu manteria o Supabase se o volume e a residência dos dados couberem no plano, com estes ajustes:

- Projeto separado para produção, chave de serviço só no cofre, nunca no `.env` da interface.
- `COOKIE_SECURE=true`, HTTPS e uma origem fixa no lugar de `127.0.0.1`.
- Backup automático e restauração ensaiada.
- Cadastro público desligado no Auth. Contas nascem por convite.
- A interface sai do Nginx da mesma máquina e vai para uma CDN. A API fica atrás de um balanceador, com mais de uma réplica, sem sessão em memória.

Se a exigência fosse AWS, o equivalente direto seria:

- Amazon RDS para PostgreSQL, com o mesmo `supabase.sql` adaptado para não depender de `auth.uid()`. O identificador do usuário viria do token e seria aplicado com `SET` local na transação, mais as políticas.
- Amazon Cognito no lugar do Supabase Auth, com o papel em grupo, não num atributo que o usuário edita.
- A interface em CloudFront e S3.
- A API em ECS ou num único serviço atrás de um Application Load Balancer, ainda sem EC2 montado à mão para esta avaliação.
- Segredos no Secrets Manager.

RDS, Cognito e EC2 não foram criados. O prazo e o custo de deixar um banco ligado para a correção pesaram mais do que demonstrar a conta AWS. O comportamento que essas peças dariam, login gerenciado e dado isolado por política, está no Supabase que a entrega executa.

A publicação que está no ar usa uma VPS da Hostinger com EasyPanel. O endereço é https://desafiobit.autofullall.com. Fiz assim por dois motivos práticos. Quem avalia abre o navegador e entra, sem precisar de Docker nem de conta no Supabase. E cada push na `main` que passa nos testes atualiza esse site, então a versão publicada acompanha o repositório. O EasyPanel já estava na VPS e entende o Compose que o projeto já tinha. O HTTPS termina nesse painel. A API não fica exposta: só a interface recebe o domínio e encaminha `/api`. Os dados continuam no Supabase. A VPS não virou um segundo banco.
