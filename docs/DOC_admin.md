# Documentação - admin.py

## Visão Geral

O `admin.py` é o painel CLI para o vendedor gerenciar licenças.

## Comandos

### Criar nova licença

```bash
python admin.py criar <nome> <contato> [observações]
```

Exemplo:
```bash
python admin.py criar "João Silva" "+55 11 99999-9999" "Cliente VIP"
```

### Buscar licença

Busca por nome, contato ou key parcial:

```bash
python admin.py buscar <termo>
```

Exemplo:
```bash
python admin.py buscar "Joao"
```

### Listar todas as licenças

```bash
python admin.py listar
```

Mostra todas as licenças com status, usuário registrado e último login.

### Ver detalhes de uma licença

```bash
python admin.py info <key>
```

Exemplo:
```bash
python admin.py info "A1B2C3D4-E5F6-..."
```

### Revogar licença

Bloqueia uma licença (usuário será desconectado):

```bash
python admin.py revogar <key>
```

### Reativar licença

Reativa uma licença bloqueada:

```bash
python admin.py reativar <key>
```

### Deletar licença

Deleta permanentemente (iréversível):

```bash
python admin.py deletar <key>
```

## Status das Licenças

| Status | Cor | Significado |
|--------|-----|------------|
| DISPONÍVEL | Verde | Licença não utilizada |
| EM USO | Azul | Usuário ativo |
| BANIDO | Vermelho | Revogada/bloqueada |

## Fluxo de Venda

1. **Gerar licença**: `python admin.py criar "Cliente" "contato"`
2. **Enviar key**: Copiar a key gerada
3. **Cliente registra**: No script.js, insere username, senha e license key
4. **Usar**: Cliente joga no chess.com com o assistente