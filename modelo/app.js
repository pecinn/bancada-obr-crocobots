
const toast = (msg) => {
  const el=document.getElementById('toast'); if(!el)return;
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2200);
};

document.querySelectorAll('[data-nav]').forEach(a=>{
  a.addEventListener('click',()=>toast(a.dataset.nav));
});

document.querySelectorAll('.challenge button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const card=btn.closest('.challenge');
    const title=card?.querySelector('h3')?.textContent || 'Desafio';
    toast('Abrindo: '+title);
  });
});

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    toast('Etapa: '+tab.textContent.trim());
  });
});

// Program blocks: click palette blocks to add to workspace.
const codeStack=document.getElementById('codeStack');
if(codeStack){
  document.querySelectorAll('.palette .block').forEach(src=>{
    src.addEventListener('click',()=>{
      const type=[...src.classList].find(c=>['move','motor','event','control','sensor','operator','variable','sound'].includes(c))||'move';
      const clone=document.createElement('div');
      clone.className='code-block '+type;
      clone.draggable=true;
      clone.innerHTML=src.dataset.code || src.textContent.trim();
      codeStack.appendChild(clone);
      toast('Bloco adicionado ao programa');
    });
  });

  codeStack.addEventListener('dragover',e=>e.preventDefault());
  codeStack.addEventListener('click',e=>{
    const b=e.target.closest('.code-block');
    if(b && !b.classList.contains('event')) { b.remove(); toast('Bloco removido'); }
  });
}

const robot=document.getElementById('robot');
let running=false, pos=0;
function resetRobot(){
  if(!robot)return;
  robot.style.transform='translate(0,0) rotate(0deg)';
  pos=0; running=false;
  const state=document.getElementById('simState'); if(state) state.textContent='Pronto';
}
function runRobot(){
  if(!robot)return;
  running=true;
  const state=document.getElementById('simState'); if(state) state.textContent='Executando';
  robot.style.transform='translate(150px,0)';
  setTimeout(()=>robot.style.transform='translate(150px,90px) rotate(90deg)',850);
  setTimeout(()=>robot.style.transform='translate(35px,90px) rotate(180deg)',1700);
  setTimeout(()=>{running=false;if(state)state.textContent='Concluído';toast('Simulação concluída!');},2550);
}
document.getElementById('runSim')?.addEventListener('click',runRobot);
document.getElementById('resetSim')?.addEventListener('click',resetRobot);
document.getElementById('stopSim')?.addEventListener('click',()=>{running=false;if(robot)robot.style.transition='none';setTimeout(()=>robot&&(robot.style.transition='transform 1s cubic-bezier(.2,.8,.2,1)'),10);toast('Simulação parada');});

document.querySelectorAll('[data-action]').forEach(b=>{
  b.addEventListener('click',()=>toast(b.dataset.action));
});
