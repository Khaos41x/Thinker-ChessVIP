# Documentação - app.py

## Visão Geral

O `app.py` é o servidor Flask + Socket.IO que fornece:
- API REST para registro/login
- Endpoints de análise de xadrez
- Engine de análise (Komodo)

## Estrutura

### Dependencies

```bash
pip install flask flask-cors flask-socketio chess
```

### Configurações

```python
HOST = "0.0.0.0"
PORT = 5000
ENGINE_PATH = "./engine/komodo-14.1-64bit.exe"
SESSION_TIMEOUT = 300
```

### Sistema de Logs

Classe `Log` com cores e timestamps:
- `Log.info()` - Informativo
- `Log.success()` - Sucesso
- `Log.warning()` - Aviso
- `Log.error()` - Erro
- `Log.engine()` - Análise de engine

## Endpoints

### Autenticação

| Endpoint | Método | Descrição |
|---------|--------|----------|
| `/api/register` | POST | Registra novo usuário |
| `/api/login` | POST | Login de usuário |
| `/api/heartbeat` | POST | Mantém sessão ativa |

### Análise

| Endpoint | Método | Descrição |
|---------|--------|----------|
| `/api/analyze` | POST | Analisa posição FEN |
| `/api/suggest` | POST | Sugere lance |
| `/api/health` | GET | Healthcheck |

## Formato das Requisições

### /api/register

```json
{
  "username": "jogador1",
  "password": "123456",
  "license_key": "A1B2C3D4-..."
}
```

### /api/analyze

```json
{
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "elo": 1200,
  "depth": 15
}
```

### Resposta analyze

```json
{
  "moves": ["e4", "e5"],
  "score": "+0.5",
  "depth": 15,
  "pv": ["e2e4", "e7e5"]
}
```

## Iniciando o Servidor

```bash
# Com engine
python app.py

# Com variáveis customizadas
HOST=0.0.0.0 PORT=5000 python app.py
```

## License Key

Gere novas keys com:

```python
from database import create_license
key = create_license("Cliente", "contato@email.com")
print(key)
```

Ou use o admin.py:

```bash
python admin.py criar "João Silva" "+55 11 99999-9999"