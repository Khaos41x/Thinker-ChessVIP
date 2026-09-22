---
name: fastapi
description: "Use when building FastAPI applications. Enforces routing patterns, dependency injection, Pydantic models. Trigger keywords: fastapi, api, endpoint, router, dependency injection."
---

# FastAPI Skill

## Estrutura de Projeto

```
app/
  __init__.py
  main.py           # App factory
  config.py          # Settings
  dependencies.py    # Dependency injection
  routers/
    users.py
    orders.py
  services/
    user_service.py
    order_service.py
  models/
    user.py          # Pydantic models
    order.py
  repositories/
    user_repo.py
    order_repo.py
tests/
```

## Roteamento

```python
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user),
) -> list[User]:
    return await user_service.list(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str) -> User:
    user = await user_service.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## Dependency Injection

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    # validate token, return user
    ...
```

## Pydantic Models

```python
from pydantic import BaseModel, Field, EmailStr

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)
```

## Error Handling

```python
from fastapi import HTTPException, status

class NotFoundError(HTTPException):
    def __init__(self, resource: str, id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} {id} not found",
        )

class ValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )
```

## Middleware

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Checklist FastAPI

- [ ] Response models definidos
- [ ] Dependency injection para DB e auth
- [ ] Validação via Pydantic
- [ ] Error handling padronizado
- [ ] Tags e descriptions nos endpoints
- [ ] Testes com TestClient
