import io, os, base64
P = 'partes/'
orig = open('original.html', encoding='utf8').read().split('\n')
css_orig = '\n'.join(orig[6:163])   # linhas 7..163
logo = open(P + 'logo_md.txt').read().strip()
# arte da entrada, do jeito que veio na pasta modelo (PNG original, sem recompressão)
login_png = 'data:image/png;base64,' + base64.b64encode(open('../modelo/robohub-login.png', 'rb').read()).decode()
plataformas_png = 'data:image/png;base64,' + base64.b64encode(open('../modelo/robohub-plataformas.png', 'rb').read()).decode()
head = '''<meta charset="utf-8">
<title>RoboHub · Portal da Robótica</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Russo+One&family=Caveat:wght@600;700&family=Sora:wght@300;400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
'''
r = lambda f: open(P + f, encoding='utf8').read() if os.path.exists(P + f) else ''
js11 = r('js11.js').replace('</script>', '').rstrip()
ordem = ['js13_plataforma.js', 'js14.js', 'js5_mundo.js', 'js6_robo.js', 'js7_cena.js', 'js8_interp.js', 'js9_ui.js',
         'js9b_resgate.js', 'js16_formatos.js', 'js17_robohub.js', 'js15_trilha.js']
out = (head + css_orig + '\n' + r('css_novo.css') + '\n' + r('css_portal.css') + '\n' + r('css_robohub.css') + '\n' + r('css_modelo.css') + '\n</style>\n' +
       r('html_novo.html').replace('LOGO_DATA', logo) + '\n' + r('html_portal.html').replace('ROBOHUB_LOGIN_DATA', login_png).replace('ROBOHUB_PLATAFORMAS_DATA', plataformas_png).replace('LOGO_DATA', logo) +
       '\n<script>\n' + '\n'.join(r(f) for f in ordem) +
       '\n/* =======================================================================\n   10. PARTIDA\n   ======================================================================= */\n' +
       r('embutido.js') + '\n' + r('js10_partida.js') + '\n' + js11 + '\n</script>\n')
open('bancada-obr.html', 'w', encoding='utf8').write(out)
# so o JS para checar a sintaxe
i = out.index('<script>\n"use strict"'); j = out.rindex('</script>')
open('check.js', 'w', encoding='utf8').write(out[i + 9:j])
print(len(out))
