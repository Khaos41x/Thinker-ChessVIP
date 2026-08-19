# SESSION — Thinker Chess VIP

## Estado atual (último commit: `856adc8`)

Tudo commitado e sincronizado com `origin/master`. Working tree limpo.

---

## O que é o projeto

**Thinker Chess VIP (aka KrypBot)** — Tampermonkey userscript + servidor Flask local que se integra ao Chess.com para fornecer:

- Jogadas automáticas via engine Komodo 14.1
- Painel de controle flutuante no navegador
- Eval bar em tempo real
- Auto-adjust de dificuldade baseado em desempenho
- Smart Pacing (delay adaptativo)
- Suporte a puzzles
- Sistema de rating ELO próprio com SQLite
- Sistema de licenças (venda do bot)
- Remoção de anúncios

---

## Onde paramos

### 1. Eval Bar (ciclo mais recente de trabalho)

Foi o maior foco antes da otimização. Implementamos e ajustamos:

- **Endpoint `/eval`** em `app.py:394` — análise ultrarrápida (0.05s) na `ponder_engine` para não conflitar com a engine principal
- **Orientação da barra** — correção baseada no lado do jogador (detectado via atributo `flipped` do DOM)
- **Polling** — frontend busca `/eval` a cada ~500ms com o FEN atual
- **Anti-flicker removido** — commit `fdc79f6` removeu o filtro de micro-mudanças para feedback visual instantâneo
- **Score da perspectiva do jogador** — commit `057fe24` ajusta o sinal do score baseado em quem está jogando
- **Documentação matemática** completa em `eval_bar.md` (sigmoide, tanh, EMA smoothing, mate handling, confidence system)

**Pendências na Eval Bar (não implementado):**
- Suavização visual com `requestAnimationFrame` + lerp no frontend (a barra ainda pula em vez de animar suave)
- Sistema de confiança baseado em depth
- Smoothing adaptativo (EMA com alpha variável)
- A barra existe e funciona, mas a experiência visual ainda não está "premium"

### 2. Otimização de concorrência e latência (último commit)

Commit `856adc8 — Optimize_engine_concurrency_and_instant_move_latencies`:

- Engine dupla: `engine` principal para jogadas + `ponder_engine` para eval e ponderação
- Sistema de ponderação (pré-cálculo da resposta do oponente em background thread)
- Cache LRU de análises
- Limite de tempo dinâmico: se `time_limit <= 0.01s`, usa 0.02s para resposta instantânea
- Opening book para lances iniciais (evita carregar a engine desnecessariamente)
- Thread pool indireto via `threading.Thread` para ponderação

### 3. Auto-Adjust de Rating

- Sistema em `core/rating.py` que ajusta ELO automaticamente baseado nas últimas N partidas
- Frontend `AutoAdjustRating` class em `script.js` que sobe/desce dificuldade conforme win rate
- Detecta rating do oponente pelo DOM e ajusta base inicial

### 4. Sistema de Licenças

- `database.py` — SQLite com tabelas `licenses` e `users`
- `admin.py` — CLI para criar, buscar, listar, revogar, reativar licenças
- Sistema de login e proteção por licença

---

## Arquitetura atual

```
Frontend (script.js via Tampermonkey)
  └── GM_xmlhttpRequest → localhost:5050
        │
        ├── /getmove     → Komodo engine → jogada UCI
        ├── /eval        → Ponder engine → score {cp, mate, depth}
        ├── /record-match → core/rating.py → SQLite
        ├── /rating/<user> → rating.get_rating_summary()
        ├── /ratings      → ranking dos jogadores
        ├── /history/<user> → match history
        └── /health       → status + cache size

Engines:
  - Komodo 14.1 (principal para jogadas, Skill 0-25)
  - Komodo 14.1 (ponder_engine para eval + ponderação)
  - 2 instâncias simultâneas com Threads/Hash configuráveis
```

---

## Para quem for continuar

### Próximos passos mais naturais

1. **Finalizar a animação da Eval Bar** — implementar `requestAnimationFrame` com lerp/suavização no frontend para dar a sensação premium descrita no `eval_bar.md`
2. **Sistema de confiança da eval** — atenuar scores de low depth
3. **Persistência de configurações no servidor** — hoje tudo fica em localStorage
4. **Modo torneio / simulação** — partidas automáticas entre bots
5. **Web interface para configuração remota** — hoje só via painel flutuante no Chess.com
6. **Migrar para Stockfish** (mais forte que Komodo 14, open-source, com suporte NNUE)
7. **Multi-engine** — permitir escolher engine na UI
8. **Testes automatizados** — não existe nenhum teste ainda

### Comandos úteis

```bash
# Iniciar servidor
python app.py

# Gerenciar licenças
python admin.py listar
python admin.py criar "Nome" "contato"

# Init DB
python -c "import database; database.init_db()"
```

### Dependências

- Python 3.13+
- `python-chess`, `flask`, `flask-cors`, `flask-socketio`
- Komodo 14.1 em `C:\Users\casa\Downloads\komodo-14\`
- Tampermonkey no navegador com `script.js` instalado

---

*Última atualização: 17/06/2026*
