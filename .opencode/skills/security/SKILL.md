---
name: security
description: "Use when implementing or reviewing security: auth, encryption, vulnerability prevention, secrets management. Trigger keywords: security, auth, encrypt, vulnerability, OWASP, secrets."
---

# Security Skill

## OWASP Top 10 (Prevenção)

### 1. Broken Access Control
- Implementar RBAC/ABAC
- Validação server-side sempre
- Negar por padrão

### 2. Cryptographic Failures
- Usar bcrypt/argon2 para senhas
- TLS 1.3 para trânsito
- AES-256 para repouso
- Nunca MD5/SHA1 para senhas

### 3. Injection
- Prepared statements para SQL
- Validação e sanitização de inputs
- Output encoding para XSS

### 4. Insecure Design
- Threat modeling na fase de design
- Principle of least privilege
- Defense in depth

### 5. Security Misconfiguration
- Headers de segurança obrigatórios
- Desabilitar features desnecessárias
- Configuração mínima segura

## Autenticação

```python
# JWT com refresh token
access_token = create_access_token(
    data={"sub": user.id},
    expires_delta=timedelta(minutes=15)
)
refresh_token = create_refresh_token(
    data={"sub": user.id},
    expires_delta=timedelta(days=7)
)
```

## Headers de Segurança

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## Secrets Management

- **NUNCA** em código fonte
- Variáveis de ambiente ou secret manager
- `.env` no `.gitignore` sempre
- Secrets rotation regular
- Audit log de acesso a secrets

## Checklist Security

- [ ] Senhas hasheadas com bcrypt/argon2
- [ ] HTTPS em todas as rotas
- [ ] Headers de segurança configurados
- [ ] Inputs validados e sanitizados
- [ ] Secrets em variáveis de ambiente
- [ ] Rate limiting em endpoints
- [ ] Logging de operações sensíveis
- [ ] Dependências auditadas
