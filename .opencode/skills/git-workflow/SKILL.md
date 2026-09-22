---
name: git-workflow
description: "Use when committing, branching, merging, or managing Git. Enforces conventional commits, branch naming, PR flow. Trigger keywords: git, commit, branch, merge, PR, conventional commits."
---

# Git Workflow Skill

## Branch Naming

```
feat/nome-da-feature
fix/nome-do-bug
docs/atualizacao-documentacao
refactor/nome-do-refactor
test/adicionando-testes
chore/atualizacao-dependencias
hotfix/corrigir-producao
```

## Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipos
| Tipo | Descrição |
|---|---|
| feat | Nova funcionalidade |
| fix | Correção de bug |
| docs | Documentação |
| style | Formatação (não afeta lógica) |
| refactor | Refatoração (não adiciona feature/fix) |
| test | Adiciona ou corrige testes |
| chore | Configurações, dependências |
| perf | Melhoria de performance |
| ci | Mudanças no CI/CD |
| build | Mudanças no build |

### Exemplos
```
feat(auth): add JWT token refresh
fix(api): handle null response from external service
docs(readme): update installation steps
refactor(db): extract query builder to separate module
```

## Fluxo de Trabalho

1. Criar branch da `main`: `git checkout -b feat/nome`
2. Trabalhar com commits pequenos e atômicos
3. Push para origin: `git push -u origin feat/nome`
4. Abrir PR para `main`
5. Code review aprovado
6. Squash merge ou merge commit
7. Deletar branch remota

## Regras

- Nunca commitar direto na `main`
- Commits devem ser atômicos (uma mudança lógica)
- Mensagens claras e descritivas
- Não forçar push em branches compartilhadas
- Usar `git stash` para trabalho temporário
- Sempre pull antes de push

## Tags e Releases

```
v1.0.0     # Major: breaking changes
v0.1.0     # Minor: novas features
v0.0.1     # Patch: correções
```

## Checklist Git

- [ ] Branch naming segue o padrão
- [ ] Commits são atômicos
- [ ] Mensagens usam Conventional Commits
- [ ] Branch atualizada com main
- [ ] PR com descrição clara
- [ ] Review aprovado antes de merge
