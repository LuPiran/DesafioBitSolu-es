# Dicionário de dados

O banco da entrega é o PostgreSQL do Supabase. O script de criação é `database/supabase.sql`. Ele cria tabelas, funções, gatilhos e as políticas de linha (RLS).

A senha não fica neste modelo. O Supabase Auth guarda o usuário de login, o hash da senha e os metadados da conta. A tabela `profiles` é o cadastro que a aplicação lê.

`database/schema.sql` é o modelo anterior, em que a própria API guardava usuário e hash. Ele não é aplicado no ambiente atual.

## Convenções

- Identificadores são UUID.
- Datas são `timestamptz`, gravadas em UTC e exibidas em horário local no navegador.
- Texto de status e categoria é controlado por `check`, não por uma tabela solta, para a API e o banco rejeitarem o mesmo conjunto de valores.
- RLS está ligado e forçado nas duas tabelas. Sem política, a operação é negada.
- O papel `anon` não tem permissão nas tabelas. O papel `authenticated` recebe só o que as políticas liberam.
- A chave `service_role` ignora o RLS. Ela é usada apenas por `npm run seed`, nunca pelos pedidos da API.

## auth.users

Tabela interna do Supabase Auth. A aplicação não faz `select` nela.

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| id | uuid | sim | Chave primária. O mesmo valor vira `profiles.id`. |
| email | text | sim | E-mail de login, confirmado no seed. |
| encrypted_password | text | sim | Hash gerado pelo Auth. A API nunca lê nem devolve esse campo. |
| raw_user_meta_data | jsonb | não | Nome e usuário de exibição (`name`, `username`). O cliente não consegue transformar isso em privilégio. |
| raw_app_meta_data | jsonb | não | Papel (`role`: `admin` ou `padrao`). Só a chave de serviço altera esse objeto. |
| email_confirmed_at | timestamptz | não | Preenchido na criação dos usuários de demonstração. |

Ao inserir um usuário, o gatilho `on_auth_user_created` chama `handle_new_user()` e cria a linha correspondente em `profiles`.

## profiles

Cadastro do colaborador visível para o portal.

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| id | uuid | sim | Chave primária e chave estrangeira para `auth.users(id)`, com exclusão em cascata. |
| name | text | sim | De 2 a 80 caracteres. Nome exibido no cabeçalho e na lista. |
| username | text | sim | Único. De 3 a 32 caracteres, só letras minúsculas, números e ponto. |
| email | text | sim | Único sem diferenciar maiúsculas. É o mesmo e-mail do login. |
| role | text | sim | `padrao` ou `admin`. O padrão é `padrao`. |
| created_at | timestamptz | sim | Preenchido com `now()` na inserção. |

### Acesso

| Operação | Quem pode |
|---|---|
| Selecionar | O próprio usuário, ou um administrador. |
| Inserir, alterar, excluir | Ninguém autenticado. O gatilho `protect_profile_mutation` recusa a mudança quando existe `auth.uid()`. O seed passa pela chave de serviço, em que esse identificador é nulo. |

Um usuário padrão não consegue gravar `role = admin` nem pela API nem pelo cliente do Supabase com o próprio token.

## solicitations

Demanda interna.

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| id | uuid | sim | Chave primária, `gen_random_uuid()`. |
| code | text | sim | Único. Formato `SOL-0001` a `SOL-9999`. Na inclusão feita por um usuário, o gatilho gera o código e ignora qualquer valor enviado pelo cliente. |
| title | text | sim | De 5 a 120 caracteres, já sem espaços nas pontas. |
| description | text | sim | De 15 a 2000 caracteres. |
| category | text | sim | Uma de: TI, RH, Compras, Financeiro, Infraestrutura. |
| requester_id | uuid | sim | Chave estrangeira para `profiles(id)`. Na inclusão autenticada, precisa ser o `auth.uid()`. Não muda depois. |
| status | text | sim | `ABERTO`, `EM_ATENDIMENTO` ou `CONCLUIDO`. A inclusão autenticada grava `ABERTO`. |
| created_at | timestamptz | sim | Momento da abertura. Não muda. |
| updated_at | timestamptz | sim | Atualizado a cada alteração aceita. |

Índices: `requester_id` e `created_at desc`.

### Acesso

| Operação | Quem pode |
|---|---|
| Selecionar | O autor, ou um administrador. Para os demais a linha não existe: a API responde 404. |
| Inserir | O usuário autenticado, somente em nome dele mesmo e com status Aberto. |
| Alterar | O autor, ou um administrador. O gatilho ainda exige a regra de status abaixo. |
| Excluir | O autor, ou um administrador, somente enquanto o status é Aberto. |

### Regras gravadas no gatilho

- Código, solicitante e data de criação são imutáveis.
- Conteúdo (título, descrição, categoria) só muda enquanto o status é Aberto.
- Status só anda um passo: Aberto para Em atendimento, depois Em atendimento para Concluído.
- Não se altera conteúdo e status no mesmo `update`.
- Solicitação concluída não volta.

A sequência `solicitation_code_seq` não é concedida ao papel `authenticated`. Só a função `prepare_solicitation_insert()`, executada como dona do objeto, chama `nextval`.

## Funções

| Função | Função no sistema |
|---|---|
| `is_admin()` | Lê `profiles.role` do `auth.uid()` com `security definer` e `search_path` fixo. As políticas usam esse resultado. O anônimo não pode executá-la. |
| `handle_new_user()` | Cria o perfil quando nasce um usuário no Auth. Não é executável pelo cliente. |
| `prepare_solicitation_insert()` | Impede inclusão em nome de outra pessoa e atribui código e status. |
| `guard_solicitation_update()` | Impõe a ordem de status e os campos imutáveis. |
| `protect_profile_mutation()` | Impede que uma sessão de usuário altere o próprio perfil, inclusive o papel. |

## O que cada papel enxerga

| Papel | Lista, detalhe e painel | Editar e excluir | Avançar status |
|---|---|---|---|
| `padrao` | Só as próprias solicitações | Só as próprias, e só em Aberto | Só as próprias, um passo por vez |
| `admin` | Todas | Todas que estão em Aberto | Todas, um passo por vez |

O painel não tem tabela própria. Os quatro números são contados no navegador a partir da lista que a API já filtrou. Por isso o usuário padrão vê os indicadores das próprias demandas, e o administrador vê os do portal inteiro.
