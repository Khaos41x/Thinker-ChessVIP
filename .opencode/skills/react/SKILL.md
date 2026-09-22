---
name: react
description: "Use when writing, reviewing, or refactoring React code. Enforces hooks patterns, component structure, state management. Trigger keywords: react, hooks, component, JSX, state."
---

# React Skill

## Estrutura de Componentes

### Componente Funcional (padrão)
```tsx
interface UserCardProps {
  user: User
  onSelect: (userId: string) => void
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}
```

### Diretório de Componentes
```
components/
  UserCard/
    UserCard.tsx
    UserCard.test.tsx
    UserCard.stories.tsx
    index.ts
```

## Hooks

### Regras
- Chamadas em ordem, sem condicionais
- Custom hooks prefixed com `use`
- Não aninhar hooks dentro de loops/condições

### Padrões Comuns
```tsx
// Estado local
const [count, setCount] = useState(0)

// Efeito colateral
useEffect(() => {
  fetchData().then(setData)
}, [dependency])

// Memoização
const memoized = useMemo(() => expensiveCalc(data), [data])

// Referência
const inputRef = useRef<HTMLInputElement>(null)

// Contexto
const theme = useContext(ThemeContext)
```

## State Management

| Estado | Ferramenta |
|---|---|
| Local de componente | useState |
| Entre componentes | Props drilling ou Context |
| Global da aplicação | Zustand, Jotai |
| Server state | TanStack Query, SWR |

## Convenções

### JSX
- Sempre fechar tags auto-fecháveis
- Conditional rendering com `&&` ou ternário
- Listas com `key` única e estável
- Fragmentos ao invés de divs desnecessárias

### Estilos
- CSS Modules ou Tailwind CSS
- Sem inline styles complexos
- Responsive: mobile-first
- Dark mode via CSS variables

### Testes
```tsx
import { render, screen, fireEvent } from '@testing-library/react'

test('calls onSelect when clicked', () => {
  const onSelect = vi.fn()
  render(<UserCard user={mockUser} onSelect={onSelect} />)
  fireEvent.click(screen.getByText('John'))
  expect(onSelect).toHaveBeenCalledWith('123')
})
```

## Checklist React

- [ ] Componentes com uma responsabilidade
- [ ] Props tipadas com interface
- [ ] Keys estáveis em listas
- [ ] Efeitos com dependency array correto
- [ ] Sem dados sensíveis no state
- [ ] Lazy loading para rotas
