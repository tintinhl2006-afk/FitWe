"""Detecta desbordamiento horizontal en las páginas con sesión.

Uso (con `npm run dev` levantado):
  TEST_EMAIL=... TEST_PASSWORD=... python scripts/responsive-check.py [USER|GYM]
Usa una cuenta de pruebas. Recorre las rutas a 320, 375 y 768 px e imprime los
elementos que se salen del viewport.
"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3000")
ROLE = (sys.argv[1] if len(sys.argv) > 1 else "USER").upper()
ROUTES = {
    "USER": ["/dashboard", "/entrenamientos", "/nutricion", "/nutricion/onboarding", "/clases", "/gimnasio",
             "/perfil", "/configuracion", "/configuracion/cuenta", "/configuracion/perfil", "/configuracion/pagos",
             "/configuracion/mi-gimnasio", "/configuracion/tema", "/configuracion/idioma", "/configuracion/unidades",
             "/configuracion/exportar", "/dashboard/configuracion"],
    "GYM": ["/admin-gym", "/admin-gym/clientes", "/admin-gym/clases", "/admin-gym/acceso", "/admin-gym/empleados",
            "/admin-gym/estadisticas", "/admin-gym/facturacion", "/admin-gym/metodos-pago", "/admin-gym/tarifas",
            "/admin-gym/configuracion"],
}[ROLE]

JS = """()=>{const W=document.documentElement.clientWidth;const bad=[];
for(const e of document.querySelectorAll('body *')){
 const cs=getComputedStyle(e);if(cs.position==='fixed'||cs.visibility==='hidden'||cs.display==='none')continue;
 if(e.closest('[aria-hidden="true"],.pointer-events-none,.skiptranslate,#google_translate_element'))continue;
 const r=e.getBoundingClientRect();if(r.width===0||r.height===0||r.right<0)continue;
 const visible=(e.innerText||'').trim().length>0||['INPUT','BUTTON','SELECT','IMG','CANVAS','TEXTAREA'].includes(e.tagName);
 if(!visible)continue;
 let over=r.right>W+1;
 for(let p=e.parentElement;p&&p!==document.body&&!over;p=p.parentElement){
  if(getComputedStyle(p).position==='fixed')break;
  const o=getComputedStyle(p).overflowX;
  if((o==='hidden'||o==='clip')&&r.right>p.getBoundingClientRect().right+1&&r.left<p.getBoundingClientRect().right)over=true;
 }
 if(over)bad.push(e.tagName+'.'+String(e.className).slice(0,70)+' right='+Math.round(r.right)+' "'+(e.innerText||'').trim().slice(0,30)+'"')}
return bad.slice(0,8)}"""

WORDS = r"""()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){const el=n.parentElement;if(!el||el.closest('script,style,noscript,svg,.skiptranslate,[aria-hidden="true"]'))continue;
 const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;
 const t=n.textContent;const re=/[^\s]{4,}/g;let m;
 while((m=re.exec(t))){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);
  const rects=[...r.getClientRects()].filter(x=>x.width>0);
  const tops=new Set(rects.map(x=>Math.round(x.top/4)));
  if(tops.size>1&&!/^(https?:|[^@]+@)/.test(m[0])){out.push(m[0]+' <'+el.tagName+'>');}}}
return [...new Set(out)].slice(0,10)}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    # Un solo login (el endpoint tiene rate limit) y se reutiliza la sesión en todos los anchos.
    ctx0 = b.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx0.new_page()
    pg.goto(BASE + "/login")
    pg.fill('input[type="email"]', os.environ["TEST_EMAIL"])
    pg.fill('input[type="password"]', os.environ["TEST_PASSWORD"])
    pg.click('button[type="submit"]')
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(5000)
    if "/login" in pg.url:
        sys.exit("Login fallido: revisa TEST_EMAIL / TEST_PASSWORD (o espera 15 min si saltó el rate limit)")
    state = ctx0.storage_state()
    for w in (320, 375, 768, 1024, 1280):
        pg = b.new_context(viewport={"width": w, "height": 800}, storage_state=state).new_page()
        routes = list(ROUTES)
        for lst, prefix in ([("/entrenamientos", "/entrenamientos/"), ("/gimnasio", "/gimnasio/")] if ROLE == "USER"
                            else [("/admin-gym/clientes", "/admin-gym/clientes/")]):
            pg.goto(BASE + lst, wait_until="networkidle")
            hrefs = pg.eval_on_selector_all("a[href^='%s']" % prefix, "e=>e.map(x=>x.getAttribute('href'))")
            routes += [h for h in dict.fromkeys(hrefs) if h.count("/") == prefix.count("/")][:2]
        for r in routes:
            pg.goto(BASE + r, wait_until="networkidle")
            bad = pg.evaluate(JS)
            broken = pg.evaluate(WORDS)
            if broken:
                print(w, r, "PALABRAS PARTIDAS:", broken)
            print(w, r, "->" + pg.url.replace(BASE, ""), "OK" if not bad else "OVERFLOW")
            for x in bad:
                print("    ", x)
    b.close()
