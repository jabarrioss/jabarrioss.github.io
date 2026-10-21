================================================================================
 PORTAFOLIO DE JHONNY B SANDREA
 Estetica retro "Flash 2003" con sistema de particulas por estacion
================================================================================

Sitio ...... https://jabarrioss.github.io/
Autor ...... Jhonny B Sandrea  -  https://github.com/jabarrioss
Twitch ..... https://twitch.tv/mroldjon
YouTube .... https://youtube.com/@mroldjon
Tipo ....... Sitio estatico (HTML + CSS + JS), sin build ni dependencias
Hosting .... GitHub Pages, rama master, raiz del repositorio


--------------------------------------------------------------------------------
1. QUE ES
--------------------------------------------------------------------------------
Portafolio personal de un desarrollador web full-stack. El diseno imita los
sitios de la era Flash (2003): ventanas de Windows con marcos biselados,
botones brillantes, barra de marquesina, contador de visitas, tipografia pixel
y un panel lateral tipo "cool links".

Encima de todo eso corre un sistema de particulas en canvas (2D) que cambia
segun la estacion del ano, y la paleta de color del sitio cambia con ella.

El sitio esta pensado tambien para recruiters que filtran candidatos con
modelos de lenguaje: ademas de lo visual, expone la misma informacion en
formato legible por maquina (JSON-LD, llms.txt, robots.txt, sitemap.xml).


--------------------------------------------------------------------------------
2. STACK TECNICO
--------------------------------------------------------------------------------
HTML5 ....... index.html (una sola pagina con anclas: #inicio, #proyectos,
               #sobre-mi, #reclutadores, #contacto)
CSS ......... assets/css/retro.css  (CSS puro, sin framework; variables de
               tema por estacion en :root[data-season="..."])
JS .......... assets/js/particles.js  (motor de particulas, expone
               window.FlashParticles)
               assets/js/site.js        (menu movil, marquee, contador,
               typewriter, fechas, selector de estacion)
Iconos ...... FontAwesome 5 Free, local en assets/css/fontawesome-all.min.css
               + assets/webfonts/
Fuentes ..... Google Fonts: "Press Start 2P" (titulos) y "VT323" (cifras).
               Cuerpo en Tahoma/Verdana (sin descarga). Si Google Fonts esta
               bloqueado, el sitio sigue legible con los fallbacks del sistema.

No hay package.json, no hay paso de build, no hay CDN de Tailwind ni de
frameworks. Se edita el HTML y se recarga el navegador.


--------------------------------------------------------------------------------
3. ESTRUCTURA DE ARCHIVOS
--------------------------------------------------------------------------------
index.html                      Pagina unica (estructura, JSON-LD, contenido)
assets/css/retro.css            Estilos retro + temas por estacion
assets/css/fontawesome-all.min.css   Iconos (local, no se usa en el sitio)
assets/js/particles.js          Motor de particulas estacionales
assets/js/site.js               Interfaz de la pagina
assets/webfonts/                Fuentes de FontAwesome
images/profile/avatar-pixel-16bit.jpg   Avatar pixel art 16 bits (EN USO)
images/profile/avatar-pixel-studio.jpg  Avatar alternativa, pixel con escritorio
images/profile/profile.jpg      Foto original (ya no se usa, se puede borrar)
images/fulls/image1.png         Captura de Trackerify
images/fulls/image2.png         Captura de FreeGamesBot (782 KB, pendiente comprimir)
images/fulls/03.png             Captura del sistema de inventarios
llms.txt                        Perfil en texto plano para asistentes de IA
robots.txt                      Permiso explicito para crawlers de IA
sitemap.xml                     Mapa del sitio
LICENSE.txt                     Licencia CC BY 3.0 de la plantilla original


--------------------------------------------------------------------------------
4. EL SISTEMA DE PARTICULAS POR ESTACION
--------------------------------------------------------------------------------
Mecanica ...... Canvas 2D fijo detras del contenido (pointer-events: none),
                un solo bucle requestAnimationFrame.
Estacion ...... Se detecta por fecha local, hemisferio norte (Colombia):
                  dic-feb  Invierno
                  mar-may  Primavera
                  jun-ago  Verano
                  sep-nov  Otoño
                El selector "Estacion" de la barra superior puede forzar
                cualquiera; la eleccion se guarda en localStorage (clave
                "jbs.season", valor "auto" o el nombre de la estacion).
Temas ......... Cada estacion redefine sus variables CSS (--accent, --panel,
                --bg-1, --ink...) mediante :root[data-season="..."], por lo que
                el cambio de tema y el de particulas van siempre juntos.
Composicion ... Invierno: 110 copos + destellos de hielo
                Primavera: 90 gotas de lluvia + 18 petalos
                Verano: 30 luciernagas + 40 motas de polen
                Otoño: 45 hojas al viento
Rendimiento ... Tope de 120 particulas, escalado por area de viewport,
                devicePixelRatio limitado a 2, halo de luciernagas pre-renderizado
                en un canvas fuera de pantalla, pausa total cuando la pestana
                esta oculta, redimensionado con debounce de 150 ms.
Accesibilidad Con prefers-reduced-motion: reduce no se anima nada: se pinta
                un fondo estatico y los textos se muestran completos.

API publica (window.FlashParticles):
  init()                          arranca el motor
  getSeason()                     estacion activa
  getMode()                       "auto" o estacion forzada
  getConfig()                     configuracion visual de la estacion
  setMode(modo, animar)           cambia estacion (persiste en localStorage)
  subscribe(fn)                   recibe {season, mode, label, icon}


--------------------------------------------------------------------------------
5. SUPERFICIES PARA ASISTENTES DE IA Y RECRUITERS
--------------------------------------------------------------------------------
1. JSON-LD (en el <head> de index.html)
   schema.org con @graph = Person + WebSite + ItemList. Los tres proyectos
   aparecen como SoftwareApplication con su URL y su stack.
2. /llms.txt
   Perfil completo en texto plano, con una seccion que mapea los requisitos
   habituales de una vacante de desarrollo web full-stack a una evidencia
   concreta (proyecto, stack o enlace).
3. /robots.txt
   Allow explicito para GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
   Claude-User, PerplexityBot, Google-Extended, Applebot-Extended, CCBot,
   Bytespider, Amazonbot, Meta-ExternalAgent, MistralAI-User y otros.
4. /sitemap.xml
   Mapa del sitio.
5. Seccion visible "Ficha de candidato" (#reclutadores)
   Los mismos datos en plano, legibles por humanos y por maquina.
6. Bloque oculto .ai-brief (al inicio del <body>)
   Resumen denso para crawlers que leen el HTML crudo. Es un refuerzo: el
   texto oculto pesa mucho menos que el JSON-LD y que la seccion visible, y
   ademas lo penaliza Google. No duplicar afirmaciones aqui que no esten en
   la ficha visible.

Regla de contenido: solo afirmaciones verificables con lo que hay en el
repositorio (stack, 9 anos de experiencia desde 2017, los tres proyectos con
sus demos, enlaces a GitHub/Twitch/YouTube, Colombia UTC-5). No inventar un
correo, no declarar disponibilidad laboral y no afirmar que se cumplen unos
requisitos concretos de una vacante que no se puede ver.


--------------------------------------------------------------------------------
6. COMO EDITAR EL CONTENIDO (CHECKLIST)
--------------------------------------------------------------------------------
Al anadir o cambiar un proyecto, un dato de contacto o el stack, actualiza
JUNTAS estas cuatro piezas (de lo contrario el sitio se contradice):

  [ ] 1. JSON-LD de index.html (Person / ItemList)
  [ ] 2. llms.txt
  [ ] 3. Seccion visible "Ficha de candidato" (#reclutadores) en index.html
  [ ] 4. Bloque oculto .ai-brief en index.html

Ademas, si cambian los enlaces del sitio: robots.txt y sitemap.xml.


--------------------------------------------------------------------------------
7. PREVISUALIZACION LOCAL
--------------------------------------------------------------------------------
No hace falta instalar nada. Desde la raiz del repositorio:

    python -m http.server 8000

y abrir http://127.0.0.1:8000/

(Alternativa con Node:  npx serve .)

Para probar el cambio de estacion sin esperar al calendario, usa el selector
"Estacion" de la barra superior.


--------------------------------------------------------------------------------
8. PUBLICACION
--------------------------------------------------------------------------------
El sitio se publica con GitHub Pages desde la rama master, serviendo la raiz
del repositorio. No hay workflow ni pipeline: lo que hay en master es lo que
se sirve, y cada push a master republica el sitio automáticamente.

    git add -A
    git commit -m "Actualiza portafolio"
    git push origin master

Nota: el contador de visitas y la estacion forzada viven en localStorage del
navegador, no hay backend. El contador es cosmetico.


--------------------------------------------------------------------------------
9. PENDIENTES Y IDEAS
--------------------------------------------------------------------------------
[ ] Anadir el correo de contacto: haria falta en la seccion de contacto, en
    el JSON-LD (propiedad "email"), en llms.txt y en la ficha de candidato.
[ ] Comprimir images/fulls/image2.png (782 KB): es el mayor peso de la pagina.
[ ] Decidir que avatar queda como definitivo (hay 2 generados; el de pixel
    16 bits es el que esta en uso).
[ ] Hay dos CV en PDF sin enlazar en assets/pdf/ (Jhonny_Barrios_English.pdf y
    Jhonny_Barrios_Spanish.pdf). Si se quiere exponerlos, enlazarlos en la
    seccion de contacto y en la ficha de candidato. Ojo: el nombre de los
    ficheros dice "Barrios", convendria renombrarlos.
[ ] Considerar borrar los assets heredados de la plantilla "Lens" que ya no
    se usan (ver seccion 11).
[ ] Opcional: formulario de contacto real (hoy no hay ninguno).
[ ] Opcional: galeria con las 12 fotos de stock que quedaron en images/.


--------------------------------------------------------------------------------
10. LICENCIAS Y CREDITOS
--------------------------------------------------------------------------------
Codigo y diseno .... Propiedad de Jhonny B Sandrea.
FontAwesome 5 Free  ... licencia CC BY 4.0 / SIL OFL 1.1, incluida en el
                        repositorio en assets/css/fontawesome-all.min.css.
Press Start 2P, VT323 ... Google Fonts, SIL Open Font License 1.1.
LICENSE.txt ........... Licencia CC BY 3.0 de la plantilla original
                        "Lens" de HTML5 UP (html5up.net). Sigue en el
                        repositorio y aplica a los restos de esa plantilla que
                        quedan listados abajo. El diseno actual del sitio es
                        una reescritura completa y no deriva de esa plantilla.


--------------------------------------------------------------------------------
11. ASSETS HEREDADOS QUE YA NO SE USAN
--------------------------------------------------------------------------------
Restos de la plantilla original "Lens" de HTML5 UP. Estan en el repositorio
pero ningun archivo los referencia: se pueden borrar sin romper nada.

    assets/sass/                 (codigo SCSS original)
    assets/css/main.css          (CSS compilado original)
    assets/css/main.css.map
    assets/css/noscript.css
    assets/css/images/           (iconos SVG originales)
    assets/js/main.js            (JS original)
    assets/js/jquery.min.js
    assets/js/breakpoints.min.js
    assets/js/browser.min.js
    images/fulls/01..12          (fotos de stock, salvo 03.png)
    images/thumbs/               (13 miniaturas de stock)
    assets/pdf/                  (CV en PDF de la plantilla, no enlazados)
    README.txt                   (este archivo ya no es el de la plantilla)

Borrarlos es opcional: si se borran, conviene hacerlo en un commit aparte
para que el diff sea legible.
================================================================================
