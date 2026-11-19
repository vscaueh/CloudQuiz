const appId=import.meta.env.VITE_PARSE_APP_ID?.trim();
const key=import.meta.env.VITE_PARSE_JAVASCRIPT_KEY?.trim();
const server=import.meta.env.VITE_PARSE_SERVER_URL||'https://parseapi.back4app.com';
export const configured=Boolean(appId&&key);
let sdk;
async function parse(){if(!configured)throw new Error('A conta do Back4App ainda precisa ser conectada. Você pode experimentar o modo treino.');if(!server.startsWith('https://'))throw new Error('O backend precisa usar HTTPS.');if(!sdk){const m=await import('parse');sdk=m.default;sdk.initialize(appId,key);sdk.serverURL=server;}return sdk;}
const profile=u=>u?{id:u.id,nickname:u.get('displayName')||u.getUsername()}:null;
async function run(name,params={}){
 const p=await parse(),u=await p.User.currentAsync();
 const headers={'Content-Type':'application/json','X-Parse-Application-Id':appId,'X-Parse-JavaScript-Key':key};
 if(u?.getSessionToken())headers['X-Parse-Session-Token']=u.getSessionToken();
 // startMatch creates a new match; the other operations are reads or deduplicated writes.
 const attempts=name==='startMatch'?1:3;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const response=await fetch(server.replace(/\/+$/,'')+'/functions/'+name,{method:'POST',headers,body:JSON.stringify(params)});
   const raw=await response.text();let data;
   try{data=JSON.parse(raw);}catch{throw Object.assign(new Error('O Back4App está temporariamente indisponível. Tente novamente em alguns segundos.'),{transient:true});}
   if(!response.ok||data.error){const error=Object.assign(new Error(data.error||'Não foi possível concluir a operação.'),{code:data.code,transient:response.status===429||response.status>=500});throw error;}
   return data.result;
  }catch(error){
   if(attempt+1>=attempts||(!error.transient&&!(error instanceof TypeError)))throw error;
   await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));
  }
 }
}
export const cloudApi={
 mode:'cloud',
 async restore(){if(!configured)return null;const p=await parse();const u=await p.User.currentAsync();if(!u)return null;try{const verified=await run('getPlayer');return {id:verified.id,nickname:verified.nickname};}catch(e){if([209,101].includes(e.code)){await p.User.logOut();return null;}throw e;}},
 async login(username,password){const p=await parse();return profile(await p.User.logIn(username,password));},
 async signup({username,email,password,displayName}){const p=await parse();const u=new p.User();u.set({username,email,password,displayName});await u.signUp();if(!u.getSessionToken()){await p.User.logOut();throw new Error('Cadastro recebido. Confirme seu e-mail e depois entre na conta.');}return profile(u);},
 async logout(){const p=await parse();await p.User.logOut();},
 async startMatch(){return run('startMatch');},
 async getMatch(id){return run('getMatch',{matchId:id});},
 async submitAnswer(params){return run('submitAnswer',params);},
 async leaderboard(){return run('getLeaderboard');},
 async history(){return run('getHistory');}
};