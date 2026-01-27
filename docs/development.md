# Documentação de Desenvolvimento - Sankhya HTTP Lib

Esta biblioteca tem como objetivo facilitar a integração com o ERP Sankhya via Node.js e TypeScript.

## Estrutura do Projeto

```
http-sankhya/
├── src/
│   ├── index.ts      # Ponto de entrada (exports)
│   └── Sankhya.ts    # Implementação da classe principal
├── dist/             # Código compilado (gerado via build)
├── docs/             # Documentação
├── package.json      # Dependências e scripts
└── tsconfig.json     # Configuração TypeScript
```

## Configuração Inicial

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Compilar o Projeto**:
   ```bash
   npm run build
   ```
   Isso irá gerar os arquivos JS e de definição de tipos na pasta `dist/`.

## Desenvolvimento

### Classe `Sankhya`

A classe principal é configurada através do construtor:

```typescript
const sankhya = new Sankhya({
  urlBase: "https://api.sankhya.com.br",
  clientId: "...",
  clientSecret: "...",
  token: "..."
});
```

### Métodos Principais

- **Autenticação**:
  - `login()`: Realiza a autenticação (Lógica a ser validada conforme endpoint específico).
  - `logout()`: Encerra a sessão.

- **Serviços Sankhya (Service Layer)**:
  - `execService({ serviceName, requestBody })`: Método genérico para execução de serviços `.sbr`.
  - `loadRecords(...)`: Wrapper para `CRUDServiceProvider.loadRecords`.
  - `saveRecord(...)`: Wrapper para `CRUDServiceProvider.saveRecord`.

- **HTTP Genérico**:
  - `get`, `post`, `put`, `patch`, `delete`: Métodos diretos para chamadas REST.

## Testes (TODO)

Atualmente não há testes definidos. Recomenda-se adicionar Jest ou Mocha para testes unitários.

## Publicação no NPM

O `package.json` já contém o script `prepublishOnly` que garante o build antes de publicar.

1. Login no NPM:
   ```bash
   npm login
   ```

2. Publicar:
   ```bash
   npm publish --access public
   ```
