# Runbook operacional — Etapa 3 da calibração Elo e rollout do Módulo 14

Este runbook parte da raiz do repositório no Windows/PowerShell. A campanha oficial usa `benchmark-runs/official-v1/stage3/manifest-final.json`: 6.760 pares, 13.520 partidas, quatro workers e 500 ms por movimento. Os resultados e binários são locais e não devem ser commitados.

## 1. Iniciar a Etapa 3 em background

Feche o servidor Flask antes da campanha para não disputar o Komodo. Abra o PowerShell na raiz do repositório e execute o bloco inteiro:

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = (Resolve-Path ".").Path
$python = (Get-Command python.exe).Source
$stage3 = Join-Path $repo "benchmark-runs\official-v1\stage3"
$plan = Join-Path $stage3 "manifest-final.json"
$output = Join-Path $stage3 "results"
$komodo = Join-Path $repo "engine\komodo-14.1-64bit.exe"
$stockfish = Join-Path $repo "engine\stockfish-19\stockfish\stockfish-windows-x86-64-universal.exe"
$stdout = Join-Path $stage3 "run.stdout.log"
$stderr = Join-Path $stage3 "run.stderr.log"
$pidFile = Join-Path $stage3 "run.pid"

foreach ($requiredPath in @($plan, $komodo, $stockfish)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Arquivo obrigatório ausente: $requiredPath"
    }
}

if (Test-Path -LiteralPath $pidFile) {
    $previousPid = [int](Get-Content -LiteralPath $pidFile -Raw)
    if (Get-Process -Id $previousPid -ErrorAction SilentlyContinue) {
        throw "A Etapa 3 já está em execução no PID $previousPid"
    }
}

New-Item -ItemType Directory -Force -Path $output | Out-Null
$manifest = Get-Content -LiteralPath $plan -Raw | ConvertFrom-Json
$referenceArgs = foreach ($reference in $manifest.reference_binaries) {
    "--reference-engine"
    ('"{0}={1}"' -f $reference[0], $stockfish)
}

$runnerArgs = @(
    "-W"
    "ignore::RuntimeWarning"
    "-m"
    "tools.elo_calibration.run_matches"
    "--plan"
    ('"{0}"' -f $plan)
    "--output"
    ('"{0}"' -f $output)
    "--subject-engine"
    ('"{0}"' -f $komodo)
) + $referenceArgs

$process = Start-Process `
    -FilePath $python `
    -ArgumentList $runnerArgs `
    -WorkingDirectory $repo `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

$process.Id | Set-Content -LiteralPath $pidFile -Encoding ascii
[pscustomobject]@{
    Pid = $process.Id
    PairsExpected = $manifest.cells.Count
    GamesExpected = $manifest.cells.Count * 2
    Results = $output
    Stdout = $stdout
    Stderr = $stderr
}
```

O runner valida os hashes dos dois engines antes de jogar e falha fechado em qualquer divergência. Também é retomável: executar o bloco novamente depois de uma interrupção preserva pares válidos já gravados e agenda somente os pendentes. Nunca inicie duas instâncias ao mesmo tempo.

### Acompanhar progresso

```powershell
$stage3 = Join-Path (Resolve-Path ".").Path "benchmark-runs\official-v1\stage3"
$completed = @(Get-ChildItem -LiteralPath (Join-Path $stage3 "results\pairs") -Filter "*.json" -File -ErrorAction SilentlyContinue).Count
"Pares: $completed / 6760 | Partidas: $($completed * 2) / 13520 | $([math]::Round(100 * $completed / 6760, 2))%"
Get-Content -LiteralPath (Join-Path $stage3 "run.stderr.log") -Tail 30
```

### Confirmar término

```powershell
$stage3 = Join-Path (Resolve-Path ".").Path "benchmark-runs\official-v1\stage3"
$runnerPid = [int](Get-Content -LiteralPath (Join-Path $stage3 "run.pid") -Raw)
$running = Get-Process -Id $runnerPid -ErrorAction SilentlyContinue
$completed = @(Get-ChildItem -LiteralPath (Join-Path $stage3 "results\pairs") -Filter "*.json" -File -ErrorAction SilentlyContinue).Count
if ($running) { throw "Etapa 3 ainda está executando no PID $runnerPid" }
if ($completed -ne 6760) { throw "Execução incompleta: $completed de 6760 pares" }
if ((Get-Item -LiteralPath (Join-Path $stage3 "run.stderr.log")).Length -gt 0) {
    Get-Content -LiteralPath (Join-Path $stage3 "run.stderr.log") -Tail 100
    throw "O stderr não está vazio; investigar antes de ajustar a curva"
}
"Etapa 3 completa: 6760 pares / 13520 partidas"
```

## 2. Gerar o `CalibrationArtifact`

Com os 6.760 JSONs em `results/pairs`, execute na raiz do repositório:

```powershell
python -m tools.elo_calibration.estimate benchmark-runs/official-v1/stage3/results/pairs --output benchmark-runs/official-v1/stage3/estimates.json

python -m tools.elo_calibration.fit_curve --estimates benchmark-runs/official-v1/stage3/estimates.json --config benchmark-runs/official-v1/stage3/artifact-config.json --artifact benchmark-runs/official-v1/stage3/calibration-artifact.json --report benchmark-runs/official-v1/stage3/fit-report.json
```

O segundo comando só gera o artefato quando `operationalFailures` não excede 10% de `recordCount` e todas as 26 Skills possuem evidência finita. O arquivo final para o servidor é:

`benchmark-runs/official-v1/stage3/calibration-artifact.json`

Verificação rápida:

```powershell
$estimates = Get-Content benchmark-runs/official-v1/stage3/estimates.json -Raw | ConvertFrom-Json
$artifact = Get-Content benchmark-runs/official-v1/stage3/calibration-artifact.json -Raw | ConvertFrom-Json
if ($estimates.recordCount -ne 6760) { throw "recordCount inesperado: $($estimates.recordCount)" }
$maximumOperationalFailures = [math]::Floor($estimates.recordCount * 0.10)
if ($estimates.operationalFailures -gt $maximumOperationalFailures) { throw "Taxa de falhas operacionais acima de 10%: $($estimates.operationalFailures)/$($estimates.recordCount)" }
if (-not $artifact.checksum) { throw "CalibrationArtifact sem checksum" }
"Artifact: $($artifact.payload.artifactVersion) | Checksum: $($artifact.checksum)"
```

Os outputs são imutáveis. Se for necessário refazer o processamento por uma razão legítima, preserve os arquivos existentes como evidência antes de escolher novos nomes de saída.

## 3. Iniciar o servidor em Shadow, Canary ou Active

### Shadow — primeira inicialização recomendada

Carrega e observa o artefato, mas não executa o perfil V2:

```powershell
$env:THINKER_ELO_CALIBRATION_MODE = "shadow"
$env:THINKER_ELO_CALIBRATION_ARTIFACT = (Resolve-Path "benchmark-runs/official-v1/stage3/calibration-artifact.json").Path
python app.py
```

### Canary — promoção gradual recomendada

O exemplo abaixo ativa V2 deterministicamente para 5% das partidas. O cohort fica fixado pela identidade da partida e checksum do artefato:

```powershell
$env:THINKER_ELO_CALIBRATION_MODE = "canary"
$env:THINKER_ELO_CALIBRATION_ARTIFACT = (Resolve-Path "benchmark-runs/official-v1/stage3/calibration-artifact.json").Path
$env:THINKER_ELO_CALIBRATION_CANARY_PERCENT = "5.00"
Remove-Item Env:THINKER_ELO_CALIBRATION_CANARY_KEYS -ErrorAction SilentlyContinue
python app.py
```

Para incluir partidas específicas no canary, use tokens estáveis separados por vírgula:

```powershell
$env:THINKER_ELO_CALIBRATION_CANARY_KEYS = "runtime-game-token-1,runtime-game-token-2"
```

### Active — promoção integral

```powershell
$env:THINKER_ELO_CALIBRATION_MODE = "active"
$env:THINKER_ELO_CALIBRATION_ARTIFACT = (Resolve-Path "benchmark-runs/official-v1/stage3/calibration-artifact.json").Path
Remove-Item Env:THINKER_ELO_CALIBRATION_CANARY_PERCENT -ErrorAction SilentlyContinue
Remove-Item Env:THINKER_ELO_CALIBRATION_CANARY_KEYS -ErrorAction SilentlyContinue
python app.py
```

Variáveis operacionais:

| Variável | Uso |
| --- | --- |
| `THINKER_ELO_CALIBRATION_MODE` | `shadow`, `canary` ou `active`. Valor inválido cai para `shadow`. |
| `THINKER_ELO_CALIBRATION_ARTIFACT` | Caminho absoluto ou relativo para o JSON final. |
| `THINKER_ELO_CALIBRATION_CANARY_PERCENT` | Percentual entre `0` e `100`, com no máximo duas casas; usado em `canary`. |
| `THINKER_ELO_CALIBRATION_CANARY_KEYS` | Inclusões explícitas opcionais, separadas por vírgula. |
| `THINKER_CAPABILITY_TOKEN` | Token opcional de pelo menos 32 caracteres. Se omitido, o servidor reutiliza o arquivo local persistido e imprime sua localização. |
| `THINKER_ELO_SCALE_ID` | Override avançado; normalmente deve permanecer ausente para usar o `scale_id` assinado no artefato. |
| `THINKER_ELO_BUDGET_CLASS` | Override avançado; normalmente deve permanecer ausente para usar o budget assinado no artefato. |

Não use a variável legada `THINKER_ELO_CALIBRATION_ACTIVE` em novas operações. O rollout do backend acima é independente do rollout do userscript. Mantenha o Módulo 14 em `DISABLED`/`SHADOW_REDUCER` no frontend durante a observação inicial; só promova o adaptador instalado para `AUTO_QUEUE_CANARY` ou `ACTIVE_DDA` depois de confirmar readiness, métricas e ausência de fallbacks.

## 4. Acessar métricas Prometheus

O endpoint é loopback-only e exige o mesmo Bearer token usado pelo userscript.

Se o token é gerenciado automaticamente pelo servidor:

```powershell
$capabilityFile = if ($env:THINKER_CAPABILITY_FILE) {
    $env:THINKER_CAPABILITY_FILE
} else {
    Join-Path $env:LOCALAPPDATA "ThinkerChessVIP\capability.json"
}
$token = (Get-Content -LiteralPath $capabilityFile -Raw | ConvertFrom-Json).token
(Invoke-WebRequest -Uri "http://127.0.0.1:5050/metrics" -Headers @{ Authorization = "Bearer $token" }).Content
```

Se `THINKER_CAPABILITY_TOKEN` foi definido:

```powershell
(Invoke-WebRequest -Uri "http://127.0.0.1:5050/metrics" -Headers @{ Authorization = "Bearer $env:THINKER_CAPABILITY_TOKEN" }).Content
```

Consulta equivalente com `curl.exe`:

```powershell
curl.exe -H "Authorization: Bearer $token" http://127.0.0.1:5050/metrics
```

O endpoint deve responder `200` e `Content-Type: text/plain`; uma chamada sem Bearer retorna `401`, e acesso não loopback retorna `403`. Séries úteis incluem `thinker_engine_search_nodes_total`, métricas de duração de busca, clamps/failures, status do engine e identidade de baixa cardinalidade do artefato.

## Checklist de promoção

- Etapa 3 encerrada com 6.760 pares e stderr vazio.
- `estimates.json` com `recordCount = 6760` e `operationalFailures <= 676`.
- `calibration-artifact.json` carregado sem `invalid_artifact`.
- `/health` mostra o engine pronto.
- `/metrics` expõe o artefato esperado e não mostra crescimento anormal de fallbacks, timeouts ou restarts.
- Shadow observado antes do canary; canary pequeno observado antes de `active`.
- Rollout do userscript promovido separadamente e somente após readiness válido.
