---
name: architecture
description: "Use when designing system architecture, making technology decisions, or creating ADRs. Trigger keywords: architecture, design pattern, ADR, technology stack, system design."
---

# Architecture Skill

## Padrões Arquiteturais

### Clean Architecture
- Entidades no centro (negócio puro)
- Use Cases (regras de negócio)
- Interface Adapters (controllers, gateways)
- Frameworks & Drivers (infraestrutura)
- Regra: dependências apontam para dentro

### DDD (Domain-Driven Design)
- Bounded Contexts: separar domínios
- Agregados: consistência transacional
- Value Objects: imutáveis e sem identidade
- Domain Events: comunicar mudanças
- Ubiquitous Language: vocabulário compartilhado

### Microserviços
- Serviços pequenos e independentes
- Comunicação: sync (HTTP/gRPC) ou async (events)
- Database per service
- API Gateway para rotas
- Circuit Breaker para resiliência

### Event-Driven
- Producer → Event Bus → Consumer
- Event Sourcing: histórico completo
- CQRS: read e write separados
- Saga Pattern: transações distribuídas

## Tomada de Decisão

### Processo
1. Entender restrições (budget, time, tech)
2. Identificar opções viáveis
3. Avaliar trade-offs
4. Documentar como ADR
5. Revisitar conforme projeto evolui

### Trade-offs Comuns
| Decisão | Opção A | Opção B |
|---|---|---|
| Consistência vs Disponibilidade | CP (Banco relacional) | AP (NoSQL) |
| Monolito vs Micro | Simples, deploy único | Escalável, complexo |
| Sync vs Async | Simples, acoplado | Desacoplado, eventual |
| Build vs Buy | Controle total | Mais rápido |

## Template de ADR

```markdown
# ADR-NNNN: Título
Status: Proposto | Aceito | Depreciado
Data: YYYY-MM-DD

## Contexto
## Decisão
## Opções Consideradas
## Consequências
```
