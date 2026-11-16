(()=>{'use strict';
 const api='https://skjema.frivilligsentralen.org/api/v1/teknohjelp';
 const $=id=>document.getElementById(id),form=$('th-form');
 let selected=null,pending=null,busy=false,loading=false;
 const format=date=>new Intl.DateTimeFormat('nb-NO',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Oslo'}).format(new Date(date+'T12:00:00Z'));
 const time=s=>s.start.replace(':','.')+'–'+s.end.replace(':','.');
 function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
 async function load(){
  if(loading)return;loading=true;$('th-refresh').disabled=true;
  try{
   const response=await fetch(api+'/availability',{signal:AbortSignal.timeout(15000)}),data=await response.json();
   if(!response.ok||data.ok!==true||!Array.isArray(data.dates))throw Error();
   const fragment=document.createDocumentFragment();let free=0;
   for(const day of data.dates){
    const row=el('article',null,'th-day'),label=el('div',null,'th-day-date');
    label.append(el('h3',new Intl.DateTimeFormat('nb-NO',{day:'numeric',month:'long',timeZone:'Europe/Oslo'}).format(new Date(day.date+'T12:00:00Z'))),el('p',day.closed?'Mandag · stengt':'Mandag'));
    const list=el('div',null,'th-slots');
    for(const slot of day.slots){
     const available=slot.status==='free',button=el('button',time(slot),'th-slot');button.type='button';button.disabled=!available;
     button.append(el('span',({free:'Ledig',booked:'Opptatt',closed:'Stengt',past:'Passert'})[slot.status]||'Utilgjengelig'));
     button.setAttribute('aria-label',format(day.date)+', '+time(slot)+', '+button.lastChild.textContent);
     button.setAttribute('aria-pressed',String(selected?.date===day.date&&selected?.slot===slot.id));
     button.onclick=()=>{selected={date:day.date,slot:slot.id,...slot};$('th-receipt').hidden=true;$('th-reservation').hidden=false;$('th-form-title').textContent=format(day.date)+' kl. '+time(slot);$('th-form-status').textContent='';$('th-form-title').focus();$('th-reservation').scrollIntoView({behavior:'smooth',block:'start'});load();};
     if(available)free++;list.append(button);
    }row.append(label,list);fragment.append(row);
   }
   $('th-calendar').replaceChildren(fragment);$('th-calendar-status').textContent=free?`${free} ledige timer. Velg en tid under.`:'Ingen ledige timer akkurat nå. Kontakt oss eller sjekk igjen senere.';
  }catch{$('th-calendar-status').textContent='Vi klarte ikke å hente oppdaterte timer. Prøv «Oppdater ledige timer», eller ring 23 22 05 80.';$('th-calendar').replaceChildren();}
  finally{loading=false;$('th-refresh').disabled=false;}
 }
 form.onsubmit=async event=>{
  event.preventDefault();if(busy||!selected||!form.reportValidity())return;
  const values=Object.fromEntries(new FormData(form));const {website,...fields}=values;
  for(const key in fields)fields[key]=fields[key].trim();if(!fields.epost)delete fields.epost;
  if(!fields.navn||!fields.hjelp){$('th-form-status').textContent='Fyll inn navn og hva du trenger hjelp til.';return;}
  const choice={...selected},body=JSON.stringify({data:{...fields,dato:choice.date,tid:choice.slot},website});
  if(pending?.body!==body)pending={body,key:crypto.randomUUID()};
  busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Bestiller …';$('th-form-status').textContent='';
  try{
   const response=await fetch(api+'/bookings',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.key},body,signal:AbortSignal.timeout(20000)}),r=await response.json();
   if(!response.ok||r.ok!==true||r.status!=='registered'||typeof r.submissionId!=='string'){
    if(r.error?.code==='time_unavailable')throw Error('Timen er ikke lenger ledig, eller har startet. Velg en annen tid.');
    if(response.status===429)throw Error('Det er sendt mange forespørsler. Vent et minutt og prøv igjen.');
    throw Error('Bestillingen er ikke bekreftet. Kontroller feltene og prøv igjen.');
   }
   $('th-receipt-time').textContent=format(choice.date)+' kl. '+time(choice);$('th-reservation').hidden=true;$('th-receipt').hidden=false;$('th-receipt').focus();$('th-receipt').scrollIntoView({behavior:'smooth'});form.reset();selected=null;pending=null;
  }catch(error){$('th-form-status').textContent=error.name==='TimeoutError'||error.name==='TypeError'?'Vi fikk ikke bekreftet bestillingen. Trykk «Bekreft bestilling» igjen med de samme opplysningene; det oppretter ikke en ekstra bestilling.':error.message;}
  finally{busy=false;button.disabled=false;button.textContent='Bekreft bestilling';load();}
 };
 $('th-refresh').onclick=load;$('th-print').onclick=()=>window.print();$('th-change').onclick=()=>{$('th-reservation').hidden=true;selected=null;load();$('bestill').scrollIntoView({behavior:'smooth'});};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});setInterval(()=>{if(!document.hidden&&!busy)load();},30000);load();
})();
