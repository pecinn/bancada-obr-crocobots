import io
P='partes/'
orig=open('original.html',encoding='utf8').read().split('\n')
css_orig='\n'.join(orig[6:163])   # linhas 7..163
logo=open(P+'logo_md.txt').read().strip()
head='''<title>Bancada OBR · CROCOBOTS</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
'''
r=lambda f: open(P+f,encoding='utf8').read()
js11=r('js11.js').replace('</script>','').rstrip()
out=(head+css_orig+'\n'+r('css_novo.css')+'\n</style>\n'+r('html_novo.html').replace('LOGO_DATA',logo)+
 '\n<script>\n'+r('js14.js')+'\n'+r('js5_mundo.js')+'\n'+r('js6_robo.js')+'\n'+r('js7_cena.js')+'\n'+r('js8_interp.js')+'\n'+r('js9_ui.js')+'\n'+r('js9b_resgate.js')+
 '\n/* =======================================================================\n   10. PARTIDA\n   ======================================================================= */\n'+
 r('embutido.js')+'\n'+r('js10_partida.js')+'\n'+js11+'\n</script>\n')
open('bancada-obr.html','w',encoding='utf8').write(out)
# so o JS para checar a sintaxe
i=out.index('<script>\n"use strict"'); j=out.rindex('</script>')
open('check.js','w',encoding='utf8').write(out[i+9:j])
print(len(out))
