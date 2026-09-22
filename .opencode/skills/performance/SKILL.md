---
name: performance
description: "Use when optimizing, profiling, or testing performance. Covers caching, lazy loading, query optimization, monitoring. Trigger keywords: performance, cache, optimize, profiling, benchmark."
---

# Performance Skill

## Estratégias de Otimização

### Cache
```
Browser Cache → CDN → Application Cache → Database Cache
```

| Nível | Ferramenta | TTL |
|---|---|---|
| Browser | HTTP Cache Headers | 1h - 30d |
| CDN | CloudFlare, CloudFront | 5min - 24h |
| App | Redis, Memcached | 1min - 1h |
| Query | Materialized Views | On demand |

### Lazy Loading
```typescript
// React lazy
const Dashboard = lazy(() => import('./Dashboard'))

// Route-based
const routes = [
  {
    path: '/dashboard',
    element: <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  }
]
```

### Database
- Índices para queries frequentes
- EXPLAIN ANALYZE para identificar gargalos
- Connection pooling
- Read replicas para reads pesados
- Pagination com cursor ao invés de offset

### Frontend
- Bundle splitting
- Image optimization (WebP, lazy load)
- Critical CSS inline
- Preload de recursos críticos
- Minimizar reflows

## Métricas

| Métrica | Target |
|---|---|
| TTFB | < 200ms |
| FCP | < 1.5s |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |

## Ferramentas

| Tipo | Ferramenta |
|---|---|
| Load Test | k6, Artillery, Locust |
| Profiling | cProfile, py-spy, 0x |
| Lighthouse | Chrome DevTools |
| APM | Datadog, New Relic |

## Checklist Performance

- [ ] Cache strategy definida
- [ ] Queries otimizadas com índices
- [ ] Imagens otimizadas
- [ ] Bundle splitting implementado
- [ ] Lazy loading para rotas
- [ ] Connection pooling configurado
- [ ] Métricas monitoradas
