import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const out = (caso: string) => JSON.parse(readFileSync(`out/${caso}.json`, "utf8"));

describe("casos exemplo", () => {
  it("exemplo-1 (simples)", () => {
    expect(out("exemplo-1")).toEqual({
      "achados": [
        {
          "regra": "FS02",
          "arquivo": "assets/app.js",
          "linha": 3
        },
        {
          "regra": "FS07",
          "arquivo": "assets/app.js",
          "linha": 12
        },
        {
          "regra": "FS08",
          "arquivo": "index.html",
          "linha": 12
        }
      ],
      "pontos": 16,
      "nota": "C"
    });
  });

  it("exemplo-2 (brabo: chaves, JWT, minificado, CSP)", () => {
    expect(out("exemplo-2")).toEqual({
      "achados": [
        {
          "regra": "FS01",
          "arquivo": "assets/config.js",
          "linha": 2
        },
        {
          "regra": "FS03",
          "arquivo": "assets/config.js",
          "linha": 5
        },
        {
          "regra": "FS05",
          "arquivo": "assets/config.js",
          "linha": 9
        },
        {
          "regra": "FS01",
          "arquivo": "assets/index-4f2a9c.js",
          "linha": 1
        },
        {
          "regra": "FS04",
          "arquivo": "assets/index-4f2a9c.js",
          "linha": 1
        },
        {
          "regra": "FS11",
          "arquivo": "assets/index-4f2a9c.js",
          "linha": 2
        },
        {
          "regra": "FS09",
          "arquivo": "headers.json",
          "linha": 0
        },
        {
          "regra": "FS06",
          "arquivo": "index.html",
          "linha": 6
        },
        {
          "regra": "FS08",
          "arquivo": "index.html",
          "linha": 12
        }
      ],
      "pontos": 201,
      "nota": "F"
    });
  });

  it("exemplo-3 (brabo: sem crítico, limite de nota)", () => {
    expect(out("exemplo-3")).toEqual({
      "achados": [
        {
          "regra": "FS05",
          "arquivo": "assets/main-7c1e.js",
          "linha": 1
        },
        {
          "regra": "FS07",
          "arquivo": "assets/main-7c1e.js",
          "linha": 1
        },
        {
          "regra": "FS10",
          "arquivo": "headers.json",
          "linha": 0
        }
      ],
      "pontos": 35,
      "nota": "C"
    });
  });

  it("exemplo-4 (brabo: JWT sem role, Report-Only, HTML inline)", () => {
    expect(out("exemplo-4")).toEqual({
      "achados": [
        {
          "regra": "FS03",
          "arquivo": "assets/app-2b9d.js",
          "linha": 2
        },
        {
          "regra": "FS09",
          "arquivo": "headers.json",
          "linha": 0
        },
        {
          "regra": "FS10",
          "arquivo": "headers.json",
          "linha": 0
        },
        {
          "regra": "FS04",
          "arquivo": "index.html",
          "linha": 7
        },
        {
          "regra": "FS07",
          "arquivo": "index.html",
          "linha": 8
        }
      ],
      "pontos": 90,
      "nota": "F"
    });
  });

  it("exemplo-5 (super pica: tudo junto)", () => {
    expect(out("exemplo-5")).toEqual({
      "achados": [
        {
          "regra": "FS03",
          "arquivo": "assets/admin.js",
          "linha": 3
        },
        {
          "regra": "FS03",
          "arquivo": "assets/admin.js",
          "linha": 4
        },
        {
          "regra": "FS01",
          "arquivo": "assets/admin.js",
          "linha": 6
        },
        {
          "regra": "FS04",
          "arquivo": "assets/admin.js",
          "linha": 13
        },
        {
          "regra": "FS01",
          "arquivo": "assets/index-e81f.js",
          "linha": 1
        },
        {
          "regra": "FS02",
          "arquivo": "assets/index-e81f.js",
          "linha": 1
        },
        {
          "regra": "FS04",
          "arquivo": "assets/index-e81f.js",
          "linha": 1
        },
        {
          "regra": "FS05",
          "arquivo": "assets/index-e81f.js",
          "linha": 1
        },
        {
          "regra": "FS07",
          "arquivo": "assets/index-e81f.js",
          "linha": 1
        },
        {
          "regra": "FS11",
          "arquivo": "assets/index-e81f.js",
          "linha": 2
        },
        {
          "regra": "FS05",
          "arquivo": "assets/legado.js",
          "linha": 3
        },
        {
          "regra": "FS07",
          "arquivo": "assets/legado.js",
          "linha": 7
        },
        {
          "regra": "FS04",
          "arquivo": "assets/vendor/editor-55aa.js",
          "linha": 1
        },
        {
          "regra": "FS11",
          "arquivo": "assets/vendor/editor-55aa.js",
          "linha": 2
        },
        {
          "regra": "FS10",
          "arquivo": "headers.json",
          "linha": 0
        },
        {
          "regra": "FS06",
          "arquivo": "index.html",
          "linha": 7
        },
        {
          "regra": "FS04",
          "arquivo": "index.html",
          "linha": 13
        },
        {
          "regra": "FS08",
          "arquivo": "index.html",
          "linha": 15
        }
      ],
      "pontos": 362,
      "nota": "F"
    });
  });
});
