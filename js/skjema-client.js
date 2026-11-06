/* Public client: no API keys, recipients or persistent identity tokens. */
(function(global){
  'use strict';
  const base='https://skjema.frivilligsentralen.org';
  const pending=new Map();
  let identityToken=null;
  function setIdentity(token){identityToken=typeof token==='string'?token:null;}
  function serialize(form){
    const data={},groups=new Map();
    for(const el of form.querySelectorAll('input[name],select[name],textarea[name]')){
      if(el.name.startsWith('_')||el.disabled)continue;
      const arr=groups.get(el.name)||[];arr.push(el);groups.set(el.name,arr);
    }
    for(const [name,els] of groups){
      const el=els[0];
      if(el.type==='checkbox')data[name]=els.length===1?el.checked:els.filter(x=>x.checked).map(x=>x.value);
      else if(el.type==='radio'){const checked=els.find(x=>x.checked);if(checked)data[name]=checked.value;}
      else if(el.type==='number'){if(el.value!=='')data[name]=Number(el.value);}
      else {const value=el.value.trim();if(value!==''||el.required)data[name]=value;}
    }
    return data;
  }
  async function submit(id,data,{website='',expectedRevision,signal}={}){
    const body={data,website,...(expectedRevision===undefined?{}:{expectedRevision})};
    const fingerprint=JSON.stringify(body),prior=pending.get(id);
    // Keep key after uncertain network outcomes. A changed payload gets a new key.
    const key=prior?.fingerprint===fingerprint?prior.key:crypto.randomUUID();
    pending.set(id,{key,fingerprint});
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(base+'/api/v1/forms/'+encodeURIComponent(id)+'/submissions',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key,...(identityToken?{Authorization:'Bearer '+identityToken}:{})},body:JSON.stringify(body),signal:signal||controller.signal});
      let result;try{result=await response.json();}catch{throw new Error('Uventet svar. Innsendingen er ikke bekreftet.');}
      if(!response.ok||result?.ok!==true||result.status!=='registered'||typeof result.submissionId!=='string'){
        const error=new Error(result?.error?.code==='revision_conflict'?'Tallene er endret av en annen bruker. Last inn siden på nytt før du retter.':response.status===401?'Logg inn før du lagrer.':'Innsendingen er ikke bekreftet.');
        error.code=result?.error?.code;throw error;
      }
      pending.delete(id);return result;
    }finally{clearTimeout(timeout);}
  }
  async function attendance(id){
    const r=await fetch(base+'/api/v1/forms/'+encodeURIComponent(id)+'/attendance',{headers:identityToken?{Authorization:'Bearer '+identityToken}:{},signal:AbortSignal.timeout(15000)});
    const data=await r.json();if(!r.ok||data?.ok!==true||!Array.isArray(data.entries))throw new Error('Kunne ikke hente tall. Kontroller innloggingen.');return data.entries;
  }
  global.Skjema={submit,serialize,attendance,setIdentity};
})(window);
