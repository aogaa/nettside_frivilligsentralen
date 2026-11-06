(function(){
  'use strict';
  // Public OAuth client ID is installed only after the exact website origins are authorized.
  const clientId = document.querySelector('meta[name="skjema-google-client-id"]')?.content;
  function init(){
    const main=document.querySelector('main')||document.body;
    const panel=document.createElement('section');panel.className='container';
    const label=document.createElement('p');label.textContent='Logg inn med godkjent Google-konto for å registrere oppmøte.';
    const button=document.createElement('div');const status=document.createElement('p');status.setAttribute('role','status');
    panel.append(label,button,status);main.prepend(panel);
    if(!clientId){status.textContent='Innlogging er ikke konfigurert. Kontakt sentralen.';return;}
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    script.onload=()=>{
      google.accounts.id.initialize({client_id:clientId,auto_select:false,callback:response=>{
        window.Skjema.setIdentity(response.credential);
        status.textContent='Kontrollerer tilgang …';
        window.dispatchEvent(new Event('skjema-authenticated'));
        status.textContent='Innlogging mottatt. Tilgang kontrolleres når tallene hentes.';
      }});
      google.accounts.id.renderButton(button,{type:'standard',theme:'outline',size:'large',text:'signin_with'});
    };
    script.onerror=()=>{status.textContent='Kunne ikke åpne Google-innlogging. Prøv på nytt senere.';};
    document.head.append(script);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
