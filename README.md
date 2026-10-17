# Task P2: Segurança frontend — varredura do build publicado

Agências e times pequenos publicam SPAs (Vite/React + backend como serviço) com chave secreta no bundle,
JWT de servidor no cliente, sinks de XSS e headers faltando. O agente recebe o `dist/` publicado e os headers
de produção, aplica um catálogo fechado de 11 regras (FS01–FS11) e devolve os achados ordenados, os pontos e a nota.

Todas as chaves e tokens dos dados são de provedores **fictícios** (`pf_live_`/`pf_test_`/`pf_pub_` da PagaFácil,
`nvm_sec_`/`nvm_pub_` da Nuvem Local, JWT com `iss` `auth.nuvemlocal.example` e assinatura falsa).

| Pasta | O que é |
|---|---|
| `instruction.md` | o prompt que o agente recebe |
| `environment/` | o workspace: `README.md` com as regras e `casos/exemplo-1` (simples), `exemplo-2`..`exemplo-4` (brabos), `exemplo-5` (super pica) |
| `tests/public/` | 5 testes, um por caso `exemplo-*` |
| `solution/` | solução de referência (`solution.patch`) e o gerador (`ref.mjs`). **Não leia antes de tentar** |
| `task.json` | o contrato da task (schema do TestMyAgent) |
| `visual.json` | versão para humanos dos casos públicos (site do evento) |

O `exemplo-2` tem as armadilhas: JWT `anon` (não é achado) ao lado de JWT `servidor` (é), chave secreta só em
comentário (comentário conta), `innerHTML` com texto literal (não é achado), linha minificada com dois achados
de regras diferentes, dois links ruins na mesma linha (conta uma vez), `eval` com literal (não é achado),
CSP presente mas com `'unsafe-inline'` em `script-src`, HSTS com exatamente 1 ano (OK) e a nota F forçada por achado crítico.

> Esta é a metade pública: 5 casos. A avaliação final usa também 5 casos ocultos, nos mesmos níveis, que não estão neste repo. `tests/hidden/` aqui é a cópia dos públicos.
