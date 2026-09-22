---
name: python
description: "Use when writing, reviewing, or refactoring Python code. Enforces PEP 8, type hints, async patterns, project structure. Trigger keywords: python, pep8, type hints, async."
---

# Python Skill

## Padrões de Código

### Estrutura de Projeto
```
src/
  __init__.py
  domain/        # Entidades e regras de negócio
  application/   # Use cases
  infrastructure/ # DB, APIs externas
  interfaces/    # Controllers, CLI
tests/
  unit/
  integration/
  e2e/
```

### Type Hints (sempre)
```python
def process_order(order_id: str, items: list[OrderItem]) -> OrderResult:
    ...

async def fetch_user(user_id: UUID) -> User | None:
    ...
```

### Dataclasses / Pydantic
```python
from dataclasses import dataclass
from pydantic import BaseModel

@dataclass(frozen=True)
class Money:
    amount: decimal.Decimal
    currency: str

class CreateUserRequest(BaseModel):
    name: str
    email: str
```

### Async/Await
```python
import asyncio
from httpx import AsyncClient

async def get_users(client: AsyncClient) -> list[User]:
    response = await client.get("/users")
    return [User(**u) for u in response.json()]
```

## Convenções

### Nomes
- `snake_case` para funções e variáveis
- `PascalCase` para classes
- `UPPER_SNAKE_CASE` para constantes
- Nomes descritivos, sem abreviações

### Funções
- Máximo 20 linhas
- UmResponsabilidade
- Type hints em todos os parâmetros e retorno
- Docstrings para funções públicas

### Imports
```python
# Standard library
import os
from pathlib import Path

# Third-party
import httpx
from pydantic import BaseModel

# Local
from myproject.domain.user import User
```

### Error Handling
```python
from typing import Never

class OrderNotFoundError(Exception):
    def __init__(self, order_id: str) -> None:
        self.order_id = order_id
        super().__init__(f"Order {order_id} not found")

async def get_order(order_id: str) -> Order:
    order = await db.get_order(order_id)
    if order is None:
        raise OrderNotFoundError(order_id)
    return order
```

## Checklist Python

- [ ] Type hints em todas as funções
- [ ] `pyproject.toml` configurado
- [ ] Ruff/Black para formatação
- [ ] pytest para testes
- [ ] asyncio para I/O bound
- [ ] Dataclasses/Pydantic para data structures
- [ ] pathlib ao invés de os.path
