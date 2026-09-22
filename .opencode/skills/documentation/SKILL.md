---
name: documentation
description: "Use when writing, reviewing, or maintaining documentation. Enforces writing standards, ADR format, README structure. Trigger keywords: documentation, README, ADR, guide, docs."
---

# Documentation Skill

## Tipos de Documentação

### README.md (obrigatório em toda pasta raiz)
- O que é este projeto/pasta
- Como instalar
- Como usar
- Links para docs relacionadas

### Guias (`docs/guides/`)
- Como fazer algo específico
- Step-by-step prático
- Exemplos reais
- Troubleshooting

### Referências (`docs/reference/`)
- API documentation
- Configurações
- Comandos disponíveis
- Limitações conhecidas

### ADRs (`docs/architecture/adr/`)
- Decisões arquiteturais significativas
- Contexto, opções, decisão, consequências
- Versionados no Git

## Regras de Escrita

### Geral
- PT-BR para conteúdo, termos técnicos em inglês
- Frases curtas e diretas
- Ativo ao invés de passivo
- Listas e tabelas para informações densas

### Estrutura
```
# Título
## Contexto
## O que fazer
## Como fazer
## Exemplos
## Referências
```

### Markdown
- Headers com hierarquia lógica
- Código com syntax highlighting
- Links relativos quando possível
- Imagens no diretório `assets/`

## Template ADR

```markdown
# ADR-NNNN: Título

**Status:** Proposto | Aceito | Depreciado
**Data:** YYYY-MM-DD
**Decisor:** Nome

## Contexto
## Decisão
## Opções Consideradas
## Consequências
```

## Checklist Docs

- [ ] Toda pasta raiz tem README.md
- [ ] Guia para cada feature significativa
- [ ] ADRs para decisões irreversíveis
- [ ] Exemplos funcionais
- [ ] Links atualizados
- [ ] Ortografia revisada
