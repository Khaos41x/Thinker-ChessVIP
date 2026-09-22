---
name: clean-code
description: "Use when writing, reviewing, or refactoring code. Enforces Clean Code principles, SOLID, DRY, KISS, YAGNI. Trigger keywords: clean, refactor, code quality, readability."
---

# Clean Code Skill

## Princípios Fundamentais

### Nomes Significativos
- Nomes devem revelar intenção
- Evitar abreviações exceto nomes consagrados (i, j, k para loops)
- Usar名词 para classes, verbos para funções, adjetivos para variáveis
- Evitar nomes como `data`, `info`, `temp`, `processed`

### Funções Pequenas
- Funções devem fazer UMA coisa
- Máximo 20 linhas idealmente
- Nomes devem descrever o que a função faz
- Máximo 3 parâmetros; usar objeto quando mais

### Comentários
- Comentários devem explicar POR QUÊ, não O QUÊ
- Código auto-documentado é preferível
- TODO devem ter responsável e data
- Nunca comentar código bloqueado — deletar

### Formatação
- Funções separadas por linha em branco
- Variáveis declaradas perto de uso
- Blocos lógicos separados verticalmente
- Máximo 120 caracteres por linha

### Objetos e Estruturas
- Encapsular primitivos
- Evitar containers aninhados
- Usar Map/Set ao invés de Array para buscas
- Preferir imutabilidade

### SOLID
- **S**ingle Responsibility: uma classe = uma responsabilidade
- **O**pen/Closed: extender, não modificar
- **L**iskov: subtipos devem ser substituíveis
- **I**nterface Segregation: interfaces pequenas e específicas
- **D**ependency Inversion: depender de abstrações

### DRY, KISS, YAGNI
- **DRY**: não repetir lógica
- **KISS**: manter simples
- **YAGNI**: não implementar algo que não será usado agora

## Checklist de Revisão

- [ ] Nomes são claros e significativos?
- [ ] Funções fazem apenas uma coisa?
- [ ] Não há código duplicado?
- [ ] Comentários explicam porquê?
- [ ] Funções têm menos de 20 linhas?
- [ ] Classes têm menos de 200 linhas?
- [ ] Não há primitivos expostos?
- [ ] Código é testável?
