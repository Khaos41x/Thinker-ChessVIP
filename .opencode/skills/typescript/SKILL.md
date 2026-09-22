---
name: typescript
description: "Use when writing, reviewing, or refactoring TypeScript code. Enforces type safety, interfaces, generics. Trigger keywords: typescript, types, interfaces, generics, strict."
---

# TypeScript Skill

## Configuração Strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Tipos e Interfaces

```typescript
// Interface para objetos
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// Type para unions e aliases
type Status = 'pending' | 'active' | 'inactive'
type Result<T> = { ok: true; data: T } | { ok: false; error: string }

// Utility types
type CreateUserDTO = Omit<User, 'id' | 'createdAt'>
type PartialUser = Partial<User>
type UserMap = Record<string, User>
```

## Generics

```typescript
function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; page: number } {
  const start = page * pageSize
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
  }
}

// Constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

## Narrowing

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}

// Discriminated unions
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rectangle':
      return shape.width * shape.height
  }
}
```

## Async Patterns

```typescript
// Promise chaining
const user = await fetchUser(id)
  .then(res => res.json())
  .catch(() => null)

// Parallel
const [users, orders] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
])

// Race
const fastest = await Promise.race([
  fetchFromPrimary(),
  fetchFromFallback(),
])
```

## Convenções

- Usar `interface` para objetos, `type` para unions
- Evitar `any` — usar `unknown` quando necessário
- Preferir `const` assertions
- Usar `satisfies` para validação de tipos
- Namespaces apenas para declarações globais

## Checklist TypeScript

- [ ] strict: true no tsconfig
- [ ] Sem `any` no código
- [ ] Types para todas as funções públicas
- [ ] Error handling com Result type
- [ ] Barrel exports (index.ts)
- [ ] Testes com types inferidos
