"""Confere um .llsp3 ou .lmsp gerado pela bancada contra o formato dos apps.
   Uso: python valida_lego.py arquivo.llsp3 [spike_xml.json]
   - estrutura do zip (manifest.json, scratch.sb3 com project.json, icon.svg)
   - toda referência de bloco (next, parent, inputs, SUBSTACK) aponta para um bloco que existe
   - para o SPIKE: cada opcode usa as entradas, sombras e campos do exemplo oficial do app (spike_xml.json)"""
import sys, zipfile, io, json, re

arq = sys.argv[1]
ref = json.load(open(sys.argv[2], encoding="utf8")) if len(sys.argv) > 2 else {}
z = zipfile.ZipFile(arq)
nomes = z.namelist()
erros = []
for n in ("manifest.json", "scratch.sb3", "icon.svg"):
    if n not in nomes: erros.append("falta " + n)
man = json.loads(z.read("manifest.json"))
for k in ("type", "id", "name", "version", "hardware", "extensions", "state", "extraFiles"):
    if k not in man: erros.append("manifest sem " + k)
sb3 = zipfile.ZipFile(io.BytesIO(z.read("scratch.sb3")))
pj = json.loads(sb3.read("project.json"))
for c in pj["targets"][0]["costumes"] + pj["targets"][1]["costumes"]:
    if c["md5ext"] not in sb3.namelist(): erros.append("asset ausente " + c["md5ext"])
B = pj["targets"][1]["blocks"]
vars_ = pj["targets"][1]["variables"]
ops = {}
for k, b in B.items():
    ops.setdefault(b["opcode"], 0); ops[b["opcode"]] += 1
    for campo in ("next", "parent"):
        if b[campo] and b[campo] not in B: erros.append(f"{k} {campo} -> inexistente")
    if b["topLevel"] and b["parent"]: erros.append(f"{k} topLevel com parent")
    for nome, v in b["inputs"].items():
        for x in v[1:]:
            if isinstance(x, str) and x not in B: erros.append(f"{k}.{nome} -> inexistente")
            if isinstance(x, list) and x and x[0] == 12 and x[2] not in vars_: erros.append(f"{k}.{nome} variável sem id")
    if "VARIABLE" in b["fields"] and b["fields"]["VARIABLE"][1] not in vars_: erros.append(f"{k} VARIABLE sem id")
    if b["next"] and B[b["next"]]["parent"] != k: erros.append(f"{k} next.parent diferente")

# comparação com os exemplos oficiais do SPIKE
confere = 0
for k, b in B.items():
    x = ref.get(b["opcode"])
    if not x or b["shadow"]: continue
    confere += 1
    topo = re.match(r'<block type="[^"]+"[^>]*>(.*)</block>\s*$', re.sub(r"\s+", " ", x))
    corpo = topo.group(1) if topo else x
    # só o primeiro nível
    prof, nivel1 = 0, ""
    for t in re.finditer(r"<(/?)(block|value|field|shadow|statement|next|mutation)[^>]*>", corpo):
        pass
    campos = set(re.findall(r'<field name="([^"]+)">', re.sub(r"<shadow.*?</shadow>", "", corpo)))
    valores = dict(re.findall(r'<value name="([^"]+)"><shadow type="([^"]+)"', corpo))
    for c in campos:
        if c not in b["fields"]: erros.append(f"{b['opcode']} sem o campo {c}")
    for nome, som in valores.items():
        if nome not in b["inputs"]: erros.append(f"{b['opcode']} sem a entrada {nome}"); continue
        alvo = b["inputs"][nome][-1] if b["inputs"][nome][0] == 3 else b["inputs"][nome][1]
        if isinstance(alvo, str):
            so = B[alvo]["opcode"]
            if so != som and not (som.endswith("color-sensor-selector") and so.endswith("color-sensor-selector")):
                erros.append(f"{b['opcode']}.{nome}: sombra {so}, o app usa {som}")
        elif som not in ("math_number", "text", "math_positive_number", "math_whole_number"):
            erros.append(f"{b['opcode']}.{nome}: valor direto, o app usa a sombra {som}")
print(json.dumps({"arquivo": arq, "blocos": len(B), "conferidos_com_o_app": confere, "extensoes": pj["extensions"],
                  "opcodes": ops, "erros": sorted(set(erros))[:40]}, ensure_ascii=False, indent=1))
