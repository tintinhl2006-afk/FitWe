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

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 375, 768, 1024, 1280):
        pg = b.new_context(viewport={"width": w, "height": 800}).new_page()
        pg.goto(BASE + "/login")
        pg.fill('input[type="email"]', os.environ["TEST_EMAIL"])
        pg.fill('input[type="password"]', os.environ["TEST_PASSWORD"])
        pg.click('button[type="submit"]')
        pg.wait_for_load_state("networkidle")
        pg.wait_for_timeout(2500)
        if "/login" in pg.url:
            sys.exit("Login fallido: revisa TEST_EMAIL / TEST_PASSWORD")
        for r in ROUTES:
            pg.goto(BASE + r, wait_until="networkidle")
            bad = pg.evaluate(JS)
            print(w, r, "->" + pg.url.replace(BASE, ""), "OK" if not bad else "OVERFLOW")
            for x in bad:
                print("    ", x)
    b.close()
