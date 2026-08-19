# Documentação - users.db

## Visão Geral

O `users.db` é um banco SQLite que armazena licenças e usuários.

## Estrutura

### Tabela: licenses

Tabela gerenciada pelo vendedor/admin para criar licenças vendeis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| key | TEXT PRIMARY KEY | UUID da licença |
| owner_name | TEXT | Nome do cliente |
| contact_info | TEXT | Contato (WhatsApp, email) |
| notes | TEXT | Observações |
| created_at | TEXT | Data de criação ISO |
| last_login | TEXT | Último login ISO |
| is_active | INTEGER | 1=ativa, 0=banida |
| is_used | INTEGER | 1=usada, 0=livre |
| used_by_username | TEXT | Username do usuário |

### Tabela: users

Tabela de usuários registrados no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| username | TEXT PRIMARY KEY | Nome de usuário |
| password_hash | TEXT | SHA256 da senha |
| license_key | TEXT UNIQUE | FK para licenses |
| created_at | TEXT | Data de registro |
| last_login | TEXT | Último login |
| login_count | INTEGER | Quantidade de logins |

## Fluxo de Uso

### 1. Venda (criar licença)

```python
from database import create_license
key = create_license("João", "+55 11 99999-9999", "VIP")
# key: "A1B2C3D4-E5F6-..."
```

### 2. Registro (cliente)

```python
from database import register_user
result = register_user("jogador1", "senha123", "A1B2C3D4-E5F6-...")
# Registra e vincula a licença ao usuário
```

### 3. Login (autenticação)

```python
from database import authenticate_user
result = authenticate_user("jogador1", "senha123")
# Retorna license_key se válido
```

### 4. Verificação de licença

```python
from database import is_license_valid
valid = is_license_valid("A1B2C3D4-E5F6-...")
```

## Índices

Para performance, os seguintes índices são criados:

- `idx_licenses_active` -过滤 licenças ativas
- `idx_licenses_used` -过滤 licenças usadas
- `idx_users_license` - busca por license key

## Migrações

O banco suporta migrações automáticas para bancos antigos:
- Adiciona colunas `is_used`, `used_by_username` se não existirem
- Adiciona `login_count` se não existir

## Backup

```bash
# Backup simples
cp users.db users_backup.db

# Backup com timestamp
cp users.db "users_$(date +%Y%m%d).db"
```

## Restore

```bash
# Restore
cp users_backup.db users.db
```