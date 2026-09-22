---
name: bmad-integration
description: "Use when working with BMAD Method: running workflows, generating artifacts, using BMAD skills. Trigger keywords: bmad, PRD, epic, story, sprint, planning artifact."
---

# BMAD Integration Skill

## O que é BMAD

BMAD Method é um framework de desenvolvimento ágil com IA que oferece:
- 46 skills para diferentes fases do desenvolvimento
- 46 comandos para invocar essas skills
- Workflow completo: idea → PRD → architecture → implementation

## Skills BMAD Principais

### Fase de Descoberta
- `bmad-forge-idea` — forjar e validar uma ideia
- `bmad-product-brief` — brief do produto
- `bmad-brainstorming` — sessão de brainstorm
- `bmad-domain-research` — pesquisa de domínio
- `bmad-market-research` — pesquisa de mercado

### Fase de Planejamento
- `bmad-create-prd` — criar PRD
- `bmad-edit-prd` — editar PRD existente
- `bmad-validate-prd` — validar PRD
- `bmad-create-architecture` — criar arquitetura
- `bmad-create-epics-and-stories` — quebrar em épicos/stories

### Fase de Implementação
- `bmad-dev-story` — desenvolver uma story
- `bmad-dev-auto` — desenvolvimento automatizado
- `bmad-quick-dev` — desenvolvimento rápido
- `bmad-code-review` — revisão de código

### Fase de Qualidade
- `bmad-qa-generate-e2e-tests` — gerar testes E2E
- `bmad-review-adversarial-general` — revisão adversarial
- `bmad-review-edge-case-hunter` — caçador de edge cases
- `bmad-sprint-planning` — planejamento de sprint
- `bmad-sprint-status` — status do sprint

## Fluxo Típico com BMAD

```
1. /bmad-forge-idea         → Validar ideia
2. /bmad-product-brief      → Criar brief
3. /bmad-create-prd         → Criar PRD
4. /bmad-create-architecture → Criar arquitetura
5. /bmad-create-epics-and-stories → Quebrar em stories
6. /bmad-dev-story          → Implementar cada story
7. /bmad-code-review        → Revisar código
8. /bmad-qa-generate-e2e-tests → Gerar testes
```

## Artefatos BMAD

- `_bmad-output/planning-artifacts/` — PRDs, arquitetura, épicos
- `_bmad-output/implementation-artifacts/` — código, testes, stories

## Integração com Agents

O workspace integra BMAD com agents customizados:
- **Planner** pode usar BMAD para planejamento
- **Architect** pode usar BMAD para arquitetura
- **QA Engineer** pode usar BMAD para testes
- Skills BMAD ficam em `.agents/skills/` (auto-carregadas)

## Checklist BMAD

- [ ] BMAD instalado e configurado
- [ ] Skills BMAD acessíveis via `/bmad-*`
- [ ] Artefatos em `_bmad-output/`
- [ ] Agents integrados com BMAD
- [ ] Workflows documentados
