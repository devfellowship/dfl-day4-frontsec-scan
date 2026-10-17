# Task P2: Segurança frontend — auditoria completa antes do go-live

Uma agência pequena precisa entregar a auditoria de segurança frontend da SPA de um cliente (Vite/React + backend
como serviço) antes de ela ir ao ar. O agente faz 4 etapas encadeadas e escreve um JSON com uma chave por etapa:

| Etapa | Entrada | Saída |
|---|---|---|
| `varredura` | `dist/` + `headers.json` | achados de um catálogo fechado de 11 regras (FS01–FS11), pontos e nota A–F |
| `dependencias` | `lock.json` (formato package-lock v3) + `avisos.json` + banners `/*! nome@versao` no build | pacotes vulneráveis, avisos, severidade, caminho transitivo, menor versão que corrige e se chega ao navegador |
| `sessao` | `sessao.json` (`Set-Cookie` do login, renovação e logout) | por cookie, os problemas de uma lista fechada (Secure, HttpOnly, SameSite, Domain, prefixo, validade, logout) |
| `plano` | etapas 1–3 + `excecoes.json` | itens de correção sem repetição, exceções aceitas/ignoradas, prioridade por fórmula, esforço e nota final |

Tudo é **fictício**: chaves `pf_live_`/`pf_test_`/`pf_pub_` da PagaFácil, `nvm_sec_`/`nvm_pub_` da Nuvem Local, JWT com
`iss` `auth.nuvemlocal.example` e assinatura falsa, pacotes inventados e avisos `AVF-2026-xxxx` (nenhum CVE real).

| Pasta | O que é |
|---|---|
| `instruction.md` | o prompt que o agente recebe |
| `environment/` | o workspace: `README.md` com as regras e `casos/exemplo-1` (simples), `exemplo-2`..`exemplo-4` (brabos), `exemplo-5` (super pica) |
| `tests/public/` | 20 testes de **formato**: um por etapa em cada `exemplo-*` (confere campos e tipos, não os valores) |
| `solution/` | solução de referência: **bloqueada até o fim do hackathon** |
| `task.json` | o contrato da task (schema do TestMyAgent) |
| `visual.json` | versão para humanos das etapas e dos casos públicos (site do evento) |


> Esta é a metade pública: 5 casos, sem as respostas. Os testes daqui só conferem o formato de `out/<caso>.json`. A nota final vem de testes ocultos que conferem os valores, nestes 5 casos e em outros 5 dos mesmos níveis.
