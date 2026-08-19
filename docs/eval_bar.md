# Documento Técnico — Implementação de Eval Bar Idêntica ao Chess.com / Lichess

## Introdução

Este documento descreve uma implementação profissional de uma eval bar moderna inspirada em:

* Chess.com
* Lichess
* Stockfish

O objetivo não é criar apenas uma barra visual.

O objetivo é reproduzir:

* comportamento perceptual
* estabilidade visual
* resposta matemática
* sensação premium
* interpretação humana da vantagem
* suavização cognitiva
* dinâmica temporal

---

# 1. Arquitetura Completa

```text
┌─────────────────────┐
│     Chess Engine    │
│  (Stockfish/NNUE)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Evaluation Parser │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Score Normalizer  │
│ clamp / mate logic  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Probability Mapper  │
│ sigmoid / tanh      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Temporal Stabilizer │
│ EMA smoothing       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Animation Engine    │
│ easing / lerp       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Rendering Layer     │
│ CSS / Canvas / WebGL│
└─────────────────────┘
```

---

# 2. Modelo Matemático Fundamental

A engine retorna:

```text
score cp x
```

onde:

* `cp` = centipawns
* 100cp ≈ 1 peão

A eval bar NÃO usa diretamente:

```math
height = cp
```

Isso seria matematicamente incorreto.

---

# 3. Conversão Correta — Função Sigmoide

## Modelo Principal

P(x)=\frac{1}{1+e^{-kx}}

Onde:

| Variável | Significado                |
| -------- | -------------------------- |
| `x`      | centipawns                 |
| `k`      | constante de sensibilidade |

---

## Valor usado na prática

Valores reais usados na indústria:

| Sistema        | k      |
| -------------- | ------ |
| Lichess-like   | 0.0036 |
| Chess.com-like | 0.0040 |
| Mais agressivo | 0.0055 |

---

## Exemplo

Para:

```math
x = 200
```

e:

```math
k = 0.004
```

Temos:

P(200)=\frac{1}{1+e^{-0.004\cdot200}}

Calculando:

```math
e^{-0.8} ≈ 0.449
```

Logo:

```math
P ≈ 0.690
```

ou:

```text
69%
```

---

# 4. Alternativa Moderna — tanh()

Motores modernos frequentemente preferem:

genui{"math_block_widget_always_prefetch_v2":{"content":"y=\tanh\left(\frac{x}{s}\right)"}}

Onde:

| Variável | Significado     |
| -------- | --------------- |
| `x`      | centipawns      |
| `s`      | fator de escala |

---

## Valor típico

```math
s = 400
```

---

## Conversão para percentual

P(x)=50+50\tanh\left(\frac{x}{400}\right)

---

# 5. Comparação Visual

| CP  | Linear | Tanh  |
| --- | ------ | ----- |
| 0   | 50%    | 50%   |
| 100 | 60%    | 62%   |
| 200 | 70%    | 73%   |
| 400 | 90%    | 88%   |
| 800 | 130% ❌ | 98% ✅ |

---

# 6. Clamp Matemático

Sem clamp:

```text
+3000cp
```

destruiria a escala.

---

## Fórmula

x'=\max(-M,\min(M,x))

Onde:

```math
M = 1000
```

---

## Código

```ts
function clamp(cp: number): number {
    return Math.max(-1000, Math.min(1000, cp));
}
```

---

# 7. Tratamento de Mate

Motores retornam:

```text
mate +3
mate -5
```

Isso NÃO pode usar a mesma função de cp.

---

# Modelo Correto

S(d)=1-\frac{1}{d+1}

Onde:

| Variável | Significado       |
| -------- | ----------------- |
| `d`      | distância do mate |

---

## Exemplos

| Mate | Resultado |
| ---- | --------- |
| M1   | 0.5       |
| M2   | 0.66      |
| M5   | 0.83      |
| M10  | 0.90      |

---

## Escalonamento Final

```ts
function mateToPercent(mate: number): number {

    const d = Math.abs(mate);

    const saturation = 1 - (1 / (d + 1));

    return mate > 0
        ? 50 + saturation * 50
        : 50 - saturation * 50;
}
```

---

# 8. Temporal Smoothing

A eval bar NÃO atualiza instantaneamente.

Ela usa:

# Exponential Moving Average (EMA)

---

## Fórmula

y_{t+1}=y_t+\alpha(x_t-y_t)

---

## Onde

| Variável | Significado         |
| -------- | ------------------- |
| `x_t`    | novo valor          |
| `y_t`    | valor atual         |
| `α`      | fator de suavização |

---

# 9. Interpretação Física

A barra se comporta como:

* mola
* amortecimento
* inércia
* sistema de primeira ordem

---

# 10. Valores Reais

| α    | Sensação        |
| ---- | --------------- |
| 0.05 | cinematográfico |
| 0.10 | premium         |
| 0.15 | Chess.com-like  |
| 0.25 | responsivo      |
| 1.0  | instantâneo     |

---

# 11. Smoothing Adaptativo

Sistemas modernos ajustam:

```math
\alpha
```

com base no depth.

---

## Fórmula Profissional

\alpha(d)=\alpha_0\left(1-e^{-d/10}\right)

---

## Interpretação

| Depth | α                 |
| ----- | ----------------- |
| 5     | baixo             |
| 10    | médio             |
| 20    | forte             |
| 30    | quase instantâneo |

---

# 12. Conversão Final para UI

Depois da probabilidade:

```math
P(x)
```

---

## Altura da barra

H=P\cdot T

Onde:

| Variável | Significado   |
| -------- | ------------- |
| `P`      | probabilidade |
| `T`      | altura total  |

---

## Exemplo

```math
P=0.73
```

```math
T=500px
```

Resultado:

```math
H=365px
```

---

# 13. Modelo Completo Final

## Pipeline Matemático

```math
cp
→ clamp
→ logistic/tanh
→ probability
→ smoothing
→ interpolation
→ render
```

---

# 14. Código Production-Level

```ts
type EvalInput = {
    cp?: number;
    mate?: number;
    depth?: number;
};

export class EvalBar {

    private current = 50;

    update(data: EvalInput): number {

        let target: number;

        if (data.mate !== undefined) {

            target = this.mateToPercent(data.mate);

        } else {

            const cp = this.clamp(data.cp ?? 0);

            target = this.cpToPercent(cp);
        }

        const alpha = this.depthBasedAlpha(data.depth ?? 12);

        this.current += (target - this.current) * alpha;

        return this.current;
    }

    private clamp(cp: number): number {

        return Math.max(-1000, Math.min(1000, cp));
    }

    private cpToPercent(cp: number): number {

        return 50 + 50 * Math.tanh(cp / 400);
    }

    private mateToPercent(mate: number): number {

        const d = Math.abs(mate);

        const saturation = 1 - (1 / (d + 1));

        return mate > 0
            ? 50 + saturation * 50
            : 50 - saturation * 50;
    }

    private depthBasedAlpha(depth: number): number {

        const base = 0.15;

        return base * (1 - Math.exp(-depth / 10));
    }
}
```

---

# 15. Renderização Premium

A sensação AAA depende de:

* easing
* inertia
* motion continuity
* frame pacing
* subpixel rendering

---

# 16. Interpolação por Frame

## LERP

L(a,b,t)=a+(b-a)t

---

## Código

```ts
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
```

---

# 17. Easing Curves

Chess.com provavelmente usa:

* easeOutCubic
* easeInOutQuart
* spring interpolation

---

## Ease Out Cubic

f(t)=1-(1-t)^3

---

# 18. Frame Scheduler

```ts
function animate() {

    requestAnimationFrame(animate);

    render(evalBar.current);
}
```

---

# 19. Debounce da Engine

Engines enviam updates MUITO rápido.

Sem debounce:

* flickering
* micro oscilações
* ruído cognitivo

---

## Solução

```ts
const UPDATE_INTERVAL = 40;
```

≈ 25 FPS.

---

# 20. Sistema de Confiança

Motores em baixo depth são instáveis.

---

## Modelo

C(d)=1-e^{-d/k}

---

## Uso

```ts
visualScore = rawScore * confidence;
```

---

# 21. Anti-Flicker Heuristic

Ignorar micro mudanças:

```ts
if (Math.abs(newCp - oldCp) < 8) {
    return;
}
```

---

# 22. MultiPV Stabilization

Se:

```text
best move muda constantemente
```

então:

* reduzir alpha
* aumentar smoothing
* atrasar commits

---

# 23. Arquitetura Threaded

```text
Main UI Thread
    ↓
Animation Layer

Worker Thread
    ↓
Stockfish WASM

Queue System
    ↓
Evaluation Pipeline
```

---

# 24. Estrutura Recomendada

```text
/src
    /engine
    /eval
    /ui
    /animation
    /math
    /workers
```

---

# 25. Fórmula MAIS importante de todas

A verdadeira essência da eval bar:

f(position)\rightarrow P(win)

Você NÃO renderiza:

```text
material
```

Você renderiza:

# expectativa implícita de vitória sob análise computacional parcial.

---

# 26. O Segredo da Sensação “Premium”

Não é só matemática.

É:

```text
Matemática
+
Percepção Humana
+
UX Cognitiva
+
Estabilidade Temporal
+
Compressão Não Linear
+
Motion Design
```

Isso é o que separa:

```text
clone amador
```

de:

```text
experiência nível Chess.com
```
