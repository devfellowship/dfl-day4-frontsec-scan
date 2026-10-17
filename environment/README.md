# Segurança frontend: varredura do build publicado

Uma agência entrega SPAs (Vite/React + backend como serviço). Antes de cada deploy, alguém precisa
olhar o **build que vai para o ar** e os **headers da resposta** do site e dizer o que está vazando
ou aberto a ataque. Você faz essa varredura com um catálogo **fechado** de 11 regras e dá uma nota.

## Entrada: `casos/<caso>/`

| Caminho | Conteúdo |
|---|---|
| `dist/` | o build publicado: `index.html`, arquivos `.js` (alguns minificados numa linha só), às vezes `.js.map`, às vezes em subpastas |
| `headers.json` | `{ "<Nome-Do-Header>": "<valor>" }` — headers HTTP da resposta de `index.html` em produção |

### Formatos fictícios usados nos dados

| Coisa | Formato |
|---|---|
| Chave **secreta** da PagaFácil (pagamentos) | `pf_live_` seguido de **24 ou mais** caracteres `[A-Za-z0-9]` |
| Chave **de teste** da PagaFácil | `pf_test_` seguido de **24 ou mais** caracteres `[A-Za-z0-9]` |
| Chave **pública** da PagaFácil | `pf_pub_...` — feita para o navegador, **nunca** é achado |
| Chave **secreta** da Nuvem Local (cloud) | `nvm_sec_` seguido de **32** caracteres hexadecimais minúsculos `[0-9a-f]` |
| Chave **pública** da Nuvem Local | `nvm_pub_...` — **nunca** é achado |
| Token JWT do Auth Nuvem Local | três partes separadas por `.`: `eyJ...` `.` `<payload>` `.` `<assinatura>`. O payload é JSON em **base64url** (sem `=` no fim; `-` e `_` no lugar de `+` e `/`). A assinatura é falsa e não importa |

Um texto que não casa exatamente com o formato (menos caracteres, `_` no meio, placeholder como
`pf_live_SUA_CHAVE_AQUI`) **não é** chave.

## Quais arquivos olhar

1. Percorra `dist/` inteiro, **inclusive subpastas**. `arquivo` no resultado é o caminho relativo a `dist/`,
   com `/` (ex.: `assets/vendor/x.js`, `index.html`).
2. Só o conteúdo de arquivos `.js` e `.html` é lido. Arquivos `.map` **não são lidos** (só importam para a FS11).
   Scripts inline dentro do `.html` são lidos como qualquer linha.
3. A análise é **por linha**: `linha` é o número da linha no arquivo, começando em 1 (separe por `\n`).
   Um arquivo minificado tem tudo na linha 1.
4. **Comentários contam.** Código comentado (`// ...`) continua dentro do arquivo público, então é analisado normalmente.

## Regras (catálogo fechado)

| Regra | O que é | Onde | Pontos |
|---|---|---|---|
| `FS01` | chave secreta (`pf_live_` ou `nvm_sec_`) | `.js`, `.html` | 40 (crítico) |
| `FS02` | chave de teste (`pf_test_`) | `.js`, `.html` | 3 |
| `FS03` | JWT com papel de servidor | `.js`, `.html` | 40 (crítico) |
| `FS04` | XSS: sink de HTML alimentado por fonte controlada pelo usuário | `.js`, `.html` | 25 |
| `FS05` | `eval` / `new Function` com argumento não literal | `.js`, `.html` | 20 |
| `FS06` | `<script>` carregado por `http://` | `.html` | 15 |
| `FS07` | token/sessão guardado em `localStorage` | `.js`, `.html` | 10 |
| `FS08` | link `target="_blank"` sem `noopener`/`noreferrer` | `.html` | 3 |
| `FS09` | CSP ausente ou insegura | `headers.json` | 10 |
| `FS10` | HSTS ausente ou curto | `headers.json` | 5 |
| `FS11` | source map exposto | `.js` | 8 |

Detalhe de cada regra:

5. **FS01** — a linha contém uma chave secreta no formato da tabela de formatos (`pf_live_` + 24 ou mais
   `[A-Za-z0-9]`, ou `nvm_sec_` + 32 `[0-9a-f]`).
6. **FS02** — a linha contém `pf_test_` + 24 ou mais `[A-Za-z0-9]`. Se a mesma linha tem uma `pf_live_` e uma
   `pf_test_`, são **dois** achados (FS01 e FS02).
7. **FS03** — a linha contém um JWT. Decodifique o payload (parte do meio) e leia o campo `role`.
   Papéis **públicos**: `"anon"` e `"usuario"` → **não** é achado. Qualquer outro valor (ex.: `"servidor"`,
   `"admin"`) **ou payload sem o campo `role`** → FS03.
8. **FS04** — **sinks**: `.innerHTML =`, `.innerHTML +=`, `.outerHTML =`, `.outerHTML +=` (espaços opcionais;
   comparação `==`/`===` **não** é sink), `document.write(` e `.insertAdjacentHTML(`.
   O **trecho** de um sink vai do fim do sink até o próximo `;` da mesma linha (ou o fim da linha, se não houver `;`).
   É achado quando o trecho contém, escrito literalmente, uma destas **fontes**:
   `location.hash`, `location.search`, `location.href`, `document.URL`, `document.referrer`, `window.name`, `event.data`.
   O texto precisa aparecer exatamente assim (`event.data.titulo` contém `event.data`; `e.data` não contém).
   Não há rastreio de variável: `const q = location.search; el.innerHTML = q` **não** é achado (a fonte não está no trecho).
   Texto literal (`el.innerHTML = "<p>oi</p>"`) não é achado. `textContent`, `innerText`, `title` etc. não são sinks.
9. **FS05** — ocorrência de `eval(` (sem letra, dígito, `_` ou `$` imediatamente antes; `.` antes vale, então
   `window.eval(` conta) ou de `new Function(`. É achado quando o **primeiro caractere não-espaço** depois do `(`
   **não** é `"` nem `'`. Template com crase (`` ` ``) **não** é literal → é achado. Outras funções
   (`setTimeout`, `retrieval(`, `$eval(`) estão fora do catálogo.
10. **FS06** — linha de `.html` com uma tag `<script` cujo atributo `src="..."` começa com `http://`.
    `https://`, `//` (relativo ao protocolo) e `/` não são achado. Um `src = "http://..."` montado dentro de `.js` não conta.
11. **FS07** — `localStorage.setItem(` cujo primeiro argumento é um texto entre aspas (`"..."` ou `'...'`) que
    **contém** `token`, `jwt` ou `sessao`, sem diferenciar maiúsculas (ex.: `"auth_token"`, `'SESSAO_ID'`).
    Primeiro argumento que é variável não é achado. O que importa é a **chave**, não o valor.
    `sessionStorage` está fora desta regra.
12. **FS08** — cada tag `<a ...>` de `.html` (a tag inteira fica numa linha) com `target="_blank"` é achado se
    não tem `rel="..."` ou se as palavras do `rel` (separadas por espaço) não incluem `noopener` nem `noreferrer`.
    Tag sem `target="_blank"` nunca é achado.
13. **FS09** — (vale para FS09 e FS10: nomes de header **sem diferenciar maiúsculas**, `strict-transport-security`
    = `Strict-Transport-Security`). Só `Content-Security-Policy` conta
    (`Content-Security-Policy-Report-Only` só reporta, não protege; é ignorado). FS09 quando:
    a) o header não existe; ou
    b) a diretiva **efetiva para scripts** é insegura. Separe o valor por `;`; cada diretiva é
       `nome valor1 valor2 ...`. A diretiva efetiva é `script-src`; **se não houver `script-src`**, é `default-src`.
       Se nenhuma das duas existe → FS09. É insegura se algum valor dela é exatamente `'unsafe-inline'`,
       `'unsafe-eval'` ou `*`. Um host com curinga (`https://*.cdn.example`) **não** é `*`.
       Outras diretivas (`style-src`, `img-src`, ...) não importam, e `default-src` é ignorado quando há `script-src`.
14. **FS10** — header `Strict-Transport-Security` ausente, sem `max-age=N`, ou com `N` **menor que 31536000**
    (1 ano). `max-age=31536000` exato está OK.
15. **FS11** — linha de `.js` com `//# sourceMappingURL=<alvo>`. Achado se `<alvo>` começa com `data:` (mapa
    embutido) **ou** se o arquivo `<alvo>`, resolvido **a partir da pasta do `.js`** (`./` e `../` valem),
    existe dentro de `dist/`. Alvo que não existe não é achado. Um `.map` que existe mas ninguém referencia não é achado.
16. **FS09 e FS10** usam `"arquivo": "headers.json"` e `"linha": 0`, no máximo um achado de cada.

## Achados, pontos e nota

17. Um achado é o trio `{ regra, arquivo, linha }`. O **mesmo trio aparece uma vez só**: duas ocorrências da
    mesma regra na mesma linha = 1 achado. Regras diferentes na mesma linha = achados separados.
18. `achados` ordenado por `arquivo` (ordem de texto simples, código de caractere: `assets/...` < `headers.json` < `index.html`),
    depois `linha` (numérica, crescente), depois `regra` (`FS01` < `FS02` < ... < `FS11`).
19. `pontos` = soma dos pontos da tabela para cada achado (depois de remover duplicados).
20. `nota`:
    - se existe **qualquer** achado crítico (`FS01` ou `FS03`) → `"F"`, sejam quais forem os pontos;
    - senão: `pontos` = 0 → `"A"`; 1 a 15 → `"B"`; 16 a 35 → `"C"`; 36 a 59 → `"D"`; 60 ou mais → `"F"`.
      Os limites são **inclusivos** (15 é B, 16 é C, 59 é D, 60 é F).

## Saída: `out/<caso>.json`

```json
{
  "achados": [
    { "regra": "FS02", "arquivo": "assets/app.js", "linha": 3 },
    { "regra": "FS09", "arquivo": "headers.json", "linha": 0 }
  ],
  "pontos": 13,
  "nota": "B"
}
```

`linha` e `pontos` são inteiros. `nota` é uma de `"A"`, `"B"`, `"C"`, `"D"`, `"F"`. Sem achados → `"achados": []`.
