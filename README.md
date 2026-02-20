# http-sankhya

Uma biblioteca TypeScript para interagir com a API do ERP Sankhya. Esta biblioteca simplifica a autenticação, o tratamento de respostas e a formatação de payloads para operações CRUD comuns.

## Instalação

Certifique-se de ter as dependências instaladas:

```bash
npm install axios
```

## Uso

### Inicialização

Importe a classe `Sankhya` e inicialize-a com sua configuração.

```typescript
import { Sankhya } from './src/Sankhya'; // Ajuste o caminho conforme necessário

const config = {
    urlBase: 'https://api.sandbox.sankhya.com.br', // URL Base da API do Sankhya
    clientId: 'seu-client-id',
    clientSecret: 'seu-client-secret',
    token: 'seu-token' // Opcional: Se você já tiver um token
};

const sankhya = new Sankhya(config);
```

### Autenticação

Autentique-se na API para obter um token de sessão.

```typescript
await sankhya.login();
```
*Nota: A implementação de login utiliza um fluxo de bearer token ou credenciais enviadas via header, dependendo da configuração. Certifique-se de que seu backend suporta o endpoint de autenticação configurado.*

---

## Métodos e Exemplos

### 1. loadRecords (Buscar Múltiplos Registros)

Busca uma lista de registros com suporte a filtros, paginação e seleção de campos. Este método utiliza o serviço `CRUDServiceProvider.loadRecords`.

#### Exemplo Básico
```typescript
const produtos = await sankhya.loadRecords({
    rootEntity: 'GrupoProduto', // Nome da Tabela/Entidade no Sankhya
    criteria: {
        expression: "ATIVO = 'S'" // Filtro SQL-like
    }
});

// Retorno Exemplo:
// [
//     { "CODGRUPOPROD": "100", "DESCRGRUPOPROD": "GERAL", "ATIVO": "S" },
//     { "CODGRUPOPROD": "101", "DESCRGRUPOPROD": "MATERIA PRIMA", "ATIVO": "S" }
// ]
```

#### Exemplo com Paginação e Seleção de Campos
Para otimizar a performance, solicite apenas os campos necessários (`fieldset`) e use `offsetPage` para paginar.

```typescript
const parceiros = await sankhya.loadRecords({
    rootEntity: 'Parceiro',
    offsetPage: 1, // Página 1 (0-indexada ou conforme API)
    criteria: {
        expression: "TIPPESSOA = 'F'"
    },
    entity: {
        fieldset: {
            list: "CODPARC,NOMEPARC,CGC_CPF,EMAIL" // Campos desejados
        }
    }
});

// Retorno Exemplo:
// [
//     { "CODPARC": "200", "NOMEPARC": "CLIENTE EXEMPLO", "CGC_CPF": "123.456.789-00", "EMAIL": "cliente@email.com" },
//     { "CODPARC": "201", "NOMEPARC": "OUTRO CLIENTE", "CGC_CPF": "987.654.321-00", "EMAIL": "outro@email.com" }
// ]
```

#### Exemplo com Campos de Apresentação
Se precisar dos valores formatados (lookup), ative `includePresentationFields`.

```typescript
const vendas = await sankhya.loadRecords({
    rootEntity: 'CabecalhoNota',
    includePresentationFields: 'S', // Retorna descrições de chaves estrangeiras
    criteria: {
        expression: "DTNEG >= '01/01/2024'"
    }
});

// Retorno Exemplo:
// [
//     {
//         "NUNOTA": "100",
//         "DTNEG": "01/01/2024",
//         "CODPARC": "200",
//         "Parceiro_NOMEPARC": "CLIENTE EXEMPLO"
//     }
// ]
```

---

### 2. loadRecord (Buscar Registro Único)

Busca um único registro específico, geralmente pela Chave Primária (PK). Este método utiliza o serviço `CRUDServiceProvider.loadRecord`.

```typescript
const produto = await sankhya.loadRecord({
    rootEntity: 'Produto',
    rows: {
        row: {
            CODPROD: { "$": "1005" } // Chave Primária
        }
    },
    entity: {
        fieldset: {
            list: "*" // Retorna todos os campos
        }
    }
});

console.log(produto);
// Saída: { CODPROD: "1005", DESCRPROD: "PRODUTO TESTE", ... }

// Retorno Exemplo Completo:
// {
//     "CODPROD": "1005",
//     "DESCRPROD": "PRODUTO TESTE",
//     "ATIVO": "S",
//     "PRECO": "50.00"
// }
```

---

### 3. saveRecord (Criar ou Atualizar Registro)

Cria ou atualiza registros. Este método é específico para manipulações que utilizam o serviço `CRUDServiceProvider.saveRecord`. A biblioteca formata automaticamente o payload do objeto `localFields` para o padrão exigido pelo Sankhya.

#### Criar Novo Registro
Para criar, omita a Chave Primária (se for auto-incremental) ou passe os valores necessários.

```typescript
const novoGrupo = await sankhya.saveRecord({
    rootEntity: 'GrupoProduto',
    localFields: {
        DESCRGRUPOPROD: "NOVO GRUPO 2024",
        ATIVO: "S",
        // Outros campos obrigatórios...
    },
    // Opcional: Retornar campos criados (ex: ID gerado)
    entity: {
        fieldset: {
            list: "CODGRUPOPROD,DESCRGRUPOPROD"
        }
    }
});

// Retorno Exemplo:
// {
//     "CODGRUPOPROD": "161000",
//     "DESCRGRUPOPROD": "NOVO GRUPO 2024"
// }
```

#### Atualizar Registro Existente
Para atualizar um registro existente, você deve fornecer a propriedade `key` contendo a chave primária do registro. Isso instrui o Sankhya a realizar um update na linha específica.

```typescript
const atualizacao = await sankhya.saveRecord({
    rootEntity: 'GrupoProduto',
    localFields: {
        DESCRGRUPOPROD: "NOME ATUALIZADO", // Campos a alterar
        ATIVO: "N"
    },
    key: {
        CODGRUPOPROD: "20310006" // Chave Primária (PK) para identificação do registro
    }
});

#### Retorno Exemplo (Sucesso)
Tanto na criação quanto na atualização, a biblioteca processa a resposta e retorna um objeto limpo com os campos solicitados no `fieldset`.

```json
{
    "CODGRUPOPROD": "160700",
    "DESCRGRUPOPROD": "NOME ATUALIZADO",
    "ATIVO": "N"
}
```

#### Retorno Exemplo (Falha)
Caso ocorra algum erro (status '0'), a biblioteca retorna o objeto de resposta original contendo a mensagem de erro.

```json
{
    "serviceName": "CRUDServiceProvider.saveRecord",
    "status": "0",
    "pendingPrinting": "false",
    "transactionId": "123456789",
    "statusMessage": "Erro: O registro já existe ou violação de restrição de integridade."
}
```
```

---

### 4. Execução de Serviço Genérico (execService)

Para endpoints que não sejam CRUD padrão (ex: executar Stored Procedures, ações de workflow, ou consultas de metadados), use `execService`.

#### Exemplo: Consultar Estoque (Serviço Hipotético)
```typescript
const estoque = await sankhya.execService({
    serviceName: 'EstoqueSP.getEstoque',
    requestBody: {
        codProd: '1005',
        codEmp: '1'
    }
});
```

#### Exemplo: Deletar Registro de Forma Personalizada
Embora exista o método `.delete()`, algumas operações de exclusão no Sankhya são feitas via serviços específicos.

```typescript
await sankhya.execService({
    serviceName: 'CRUDServiceProvider.removeRecord',
    requestBody: {
        entity: {
            rootEntity: 'Parceiro',
            pk: {
                CODPARC: { "$": "999" }
            }
        }
    }
});

// Retorno Exemplo:
// {
//     "serviceName": "CRUDServiceProvider.removeRecord",
//     "status": "1",
//     "pendingPrinting": "false",
//     "transactionId": "123456789",
//     "responseBody": {}
// }
```

## Funcionalidades

- **Tratamento de Resposta**: Simplifica a resposta aninhada do Sankhya.
    - *LoadRecords*: Retorna `Array<Objeto>`.
    - *LoadRecord*: Retorna `Objeto` único (lida com ausência de metadados).
- **Transformação de Payload**: O método `saveRecord` aceita objetos simples JS (ex: `{ CAMPO: "Valor" }`) e os converte automaticamente para `{ CAMPO: { "$": "Valor" } }`.
- **Tipagem TypeScript**: Suporte completo a interfaces para garantir segurança de tipo no desenvolvimento.