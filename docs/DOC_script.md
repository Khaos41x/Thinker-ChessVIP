# Documentação - script.js

## Visão Geral

O `script.js` é um UserScript (Tampermonkey/Greasemonkey) que roda no navegador do cliente no site chess.com. Ele observa o tabuleiro, solicita sugestões de lance ao servidor e desenha dicas visuais.

## Estrutura

### Configuração

```javascript
const SERVER_URL = "http://127.0.0.1:5000";
let authToken = null;
```

### Sistema de Requisições

O script usa `GM_xmlhttpRequest` para fazer requisições ao servidor, que contorna CORS/CSP:

```javascript
const gmRequest = (endpoint, data, callback) => {
  GM_xmlhttpRequest({
    method: "POST",
    url: SERVER_URL + endpoint,
    headers: { "Content-Type": "application/json", "X-Auth-Token": authToken || "" },
    data: JSON.stringify(data),
    onload: (resp) => { callback(JSON.parse(resp.responseText)); },
    onerror: () => { callback({error:"Servidor offline"}); },
    timeout: 30000,
  });
};
```

### Registro/Login

O script exibe um modal para o usuário inserir:
- **Username**: Nome de usuário no sistema
- **Password**: Senhada conta
- **License Key**: Chave de licença comprada do vendedor

### Controle de ELO

Slider flutuante para selecionar o nível do oponente (800-2800).

### Análise

- `analyzePosition(fen, callback)`: Analisa posição completa
- `suggestMove(fen, callback)`: Sugere próximo lance

## Endpoints da API

| Endpoint | Método | Descrição |
|---------|--------|----------|
| `/api/register` | POST | Registra novo usuário |
| `/api/login` | POST | Autentica usuário |
| `/api/analyze` | POST | Analisa posição FEN |
| `/api/suggest` | POST | Sugere lance |
| `/api/heartbeat` | POST | Mantém sessão ativa |

## Instalação

1. Instale a extensão Tampermonkey no navegador
2. Crie novo script e cole o código de `script.js`
3. Acesse chess.com e faça login no modal