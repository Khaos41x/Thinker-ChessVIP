---
name: testing
description: "Use when writing tests, designing test strategy, or debugging. Trigger keywords: test, testing, unit test, integration test, E2E, TDD, coverage."
---

# Testing Skill

## Pirâmide de Testes

```
        /  E2E  \         ← Poucos, lentos, caros
       / Integração \      ← Médio número
      /   Unitários   \    ← Muitos, rápidos, baratos
```

## Tipos de Teste

### Unitários
- Testam funções/métodos isoladamente
- Mockam dependências externas
- Rápidos (< 100ms cada)
- Cobertura alvo: 80%+ para código novo

### Integração
- Testam comunicação entre componentes
- Usam banco real ou containerizado
- Testam APIs, DB, serviços externos
- Cobertura: fluxos críticos

### E2E
- Testam fluxos completos de usuário
- Usam ferramentas como Playwright, Cypress
- Poucos e focados em happy paths
- Cobertura: jornadas principais

## TDD (Test-Driven Development)

1. **Red**: escrever teste que falha
2. **Green**: implementar mínimo para passar
3. **Refactor**: melhorar código mantendo testes verdes

## Convenções

### Nomes
```
deve_[comportamento]_quando_[condição]
test_[ação]_[resultado]_[contexto]
```

### Estrutura AAA
```
Arrange: preparar dados e contexto
Act: executar ação testada
Assert: verificar resultado esperado
```

### Regras
- Um assert por teste quando possível
- Testes devem ser determinísticos
- Não testar implementação, testar comportamento
- Dados de teste não devem depender de ordem
- Mockar externals, não internals

## Cobertura

| Métrica | Meta |
|---|---|
| Line coverage | ≥ 80% |
| Branch coverage | ≥ 75% |
| Function coverage | ≥ 90% |

## Ferramentas por Ecossistema

| Ecossistema | Unit | Integration | E2E |
|---|---|---|---|
| Python | pytest | pytest + httpx | Playwright |
| TypeScript | Vitest/Jest | Vitest + MSW | Playwright |
| React | Vitest + RTL | MSW | Playwright |
| FastAPI | pytest | pytest + TestClient | httpx |
