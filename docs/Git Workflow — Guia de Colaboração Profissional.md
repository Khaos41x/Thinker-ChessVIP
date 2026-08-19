# Git Workflow — Guia de Colaboração Profissional

> Este documento define o fluxo de trabalho Git para projetos colaborativos.
> Leia do início ao fim antes de começar. Siga à risca e não haverá conflito entre colaboradores.

---

## 1. Conceito central: nunca trabalhe diretamente na `main`

A branch `main` é o código estável, funcional, que "vai pra produção". Ninguém commita direto nela. Todo desenvolvimento acontece em **branches separadas** e só entra na `main` depois de revisado.

```
main          ──────────────────────────────────────────────────►
                    ↑                        ↑
feature/login ──────┘         feature/api ──┘
```

---

## 2. Setup inicial (uma vez só)

### 2.1 Clone o repositório
```bash
git clone https://github.com/usuario/repositorio.git
cd repositorio
```

### 2.2 Configure sua identidade
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 2.3 Verifique as branches existentes
```bash
git branch -a
```

---

## 3. Fluxo diário (siga sempre essa ordem)

### Passo 1 — Atualize sua `main` local antes de qualquer coisa
```bash
git checkout main
git pull origin main
```
> Isso garante que você está partindo do código mais recente, não do que estava quando você clonou.

### Passo 2 — Crie uma branch para o que você vai fazer
```bash
git checkout -b feature/nome-descritivo
```

**Convenção de nomes de branch:**
| Prefixo | Quando usar |
|---|---|
| `feature/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `refactor/` | Refatoração sem mudar comportamento |
| `docs/` | Documentação |
| `chore/` | Configurações, dependências |

**Exemplos:**
```bash
git checkout -b feature/autenticacao-usuario
git checkout -b fix/erro-rota-login
git checkout -b refactor/modulo-pagamento
```

### Passo 3 — Trabalhe e faça commits pequenos e frequentes
```bash
# Veja o que mudou
git status

# Adicione arquivos específicos (preferível)
git add src/auth.py

# Ou adicione tudo (quando souber o que está adicionando)
git add .

# Commite com mensagem descritiva
git commit -m "feat: adiciona validação de token JWT"
```

**Convenção de mensagens de commit (Conventional Commits):**
| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `refactor:` | Refatoração |
| `docs:` | Documentação |
| `chore:` | Configurações/dependências |
| `test:` | Testes |
| `style:` | Formatação (sem mudar lógica) |

**Exemplos:**
```
feat: cria endpoint de cadastro de usuário
fix: corrige crash ao enviar formulário vazio
refactor: separa lógica de autenticação em módulo próprio
docs: atualiza README com instruções de setup
```

### Passo 4 — Antes de abrir PR, sincronize com a `main` atualizada
```bash
# Salve seu trabalho atual
git add .
git commit -m "feat: ..."

# Volte pra main e atualize
git checkout main
git pull origin main

# Volte pra sua branch e aplique as mudanças novas por cima
git checkout feature/sua-branch
git rebase main
```

> `rebase` reaplica seus commits em cima da `main` mais recente, mantendo o histórico limpo.
> Se houver conflito, o terminal vai te mostrar — veja a seção 5.

### Passo 5 — Suba sua branch pro GitHub
```bash
git push origin feature/sua-branch
```

### Passo 6 — Abra um Pull Request no GitHub
1. Acesse o repositório no GitHub
2. Clique em **"Compare & pull request"**
3. Descreva o que foi feito
4. Peça review pro seu colaborador
5. Após aprovação, faça o merge na `main`

### Passo 7 — Depois do merge, limpe a branch local
```bash
git checkout main
git pull origin main
git branch -d feature/sua-branch
```

---

## 4. Resumo do ciclo completo

```
1. git checkout main
2. git pull origin main
3. git checkout -b feature/sua-tarefa
4. [ desenvolve, commita várias vezes ]
5. git checkout main && git pull origin main
6. git checkout feature/sua-tarefa && git rebase main
7. git push origin feature/sua-tarefa
8. [ abre PR no GitHub → review → merge ]
9. git checkout main && git pull origin main
10. git branch -d feature/sua-tarefa
```

---

## 5. Resolvendo conflitos

Conflito acontece quando dois colaboradores editam **a mesma linha** do mesmo arquivo. O Git não sabe qual versão manter, então para e pede que você decida.

### Como o conflito aparece
```python
<<<<<<< HEAD
# seu código
def autenticar_usuario(token):
    return jwt.decode(token, SECRET)
=======
# código do colaborador
def autenticar_usuario(token, strict=True):
    return jwt.decode(token, SECRET, strict=strict)
>>>>>>> main
```

### Como resolver
1. Abra o arquivo no editor
2. Encontre os marcadores `<<<<<<<`, `=======`, `>>>>>>>`
3. Decida o que fica (pode ser um, pode ser os dois combinados)
4. Delete os marcadores
5. Salve o arquivo

```python
# versão final resolvida
def autenticar_usuario(token, strict=True):
    return jwt.decode(token, SECRET, strict=strict)
```

6. Adicione e continue o rebase:
```bash
git add app.py
git rebase --continue
```

> Se quiser abortar e voltar ao estado anterior: `git rebase --abort`

---

## 6. Comandos úteis do dia a dia

```bash
# Ver status atual
git status

# Ver histórico de commits (compacto)
git log --oneline --graph --all

# Ver diferença entre o que mudou e o último commit
git diff

# Salvar trabalho temporariamente sem commitar (útil pra trocar de branch)
git stash
git stash pop   # recupera depois

# Ver todas as branches (locais e remotas)
git branch -a

# Deletar branch remota depois do merge
git push origin --delete feature/sua-branch

# Desfazer último commit (mantendo as mudanças)
git reset --soft HEAD~1

# Desfazer alterações em um arquivo específico
git checkout -- arquivo.py
```

---

## 7. Regras do projeto

- ✅ Sempre `git pull origin main` antes de criar uma branch nova
- ✅ Branches pequenas e focadas — uma tarefa por branch
- ✅ Commits frequentes com mensagens claras
- ✅ Sempre `rebase` antes de abrir PR
- ✅ Revisão mútua antes de mergear na `main`
- ❌ Nunca commitar direto na `main`
- ❌ Nunca fazer `git push --force` na `main`
- ❌ Nunca commitar credenciais, senhas ou chaves de API

---

## 8. Referência rápida — cheatsheet

| O que fazer | Comando |
|---|---|
| Atualizar main local | `git pull origin main` |
| Criar branch nova | `git checkout -b feature/nome` |
| Ver o que mudou | `git status` |
| Adicionar arquivos | `git add .` ou `git add arquivo` |
| Commitar | `git commit -m "tipo: descrição"` |
| Sincronizar com main | `git rebase main` |
| Subir branch | `git push origin feature/nome` |
| Trocar de branch | `git checkout nome-da-branch` |
| Salvar sem commitar | `git stash` / `git stash pop` |
| Histórico visual | `git log --oneline --graph --all` |

---

*Dúvidas? Converse com seu colaborador antes de forçar qualquer push. Comunicação resolve 90% dos conflitos antes de acontecerem.*
