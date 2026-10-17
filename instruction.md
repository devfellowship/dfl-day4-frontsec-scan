Faça a varredura de segurança frontend de cada build publicado, para cada caso em `casos/`.

Para cada pasta `casos/<caso>/`, leia todos os arquivos `.js` e `.html` de `dist/` (inclusive subpastas) e o `headers.json`, e escreva `out/<caso>.json`.
As regras (catálogo fechado FS01–FS11), os formatos das chaves e o formato exato da saída estão no `README.md`. Siga as regras à risca: decodifique o payload dos JWT, respeite o trecho de cada sink, a diretiva efetiva da CSP, os limites inclusivos da nota e a ordenação dos achados.
Escreva só em `out/`. Não edite `tests/`, `casos/`, `README.md` nem `package*.json`.
