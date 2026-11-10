const appId=import.meta.env.VITE_PARSE_APP_ID?.trim();
const key=import.meta.env.VITE_PARSE_JAVASCRIPT_KEY?.trim();
const server=import.meta.env.VITE_PARSE_SERVER_URL||'https://parseapi.back4app.com';
export const configured=Boolean(appId&&key);
let sdk;
async function parse(){if(!configured)throw new Error('A conta do Back4App ainda precisa ser conectada. Você pode experimentar o modo treino.');if(!server.startsWith('https://'))throw new Error('O backend precisa usar HTTPS.');if(!sdk){const m=await import('parse');sdk=m.default;sdk.initialize(appId,key);sdk.serverURL=server;}return sdk;}
const profile=u=>u?{id:u.id,nickname:u.get('displayName')||u.getUsername()}:null;
export const cloudApi={
 mode:'cloud',
 async restore(){if(!configured)return null;const p=await parse();const u=await p.User.currentAsync();if(!u)return null;try{const verified=await p.Cloud.run('getPlayer');return {id:verified.id,nickname:verified.nickname};}catch(e){if([209,101].includes(e.code)){await p.User.logOut();return null;}throw e;}},
 async login(username,password){const p=await parse();return profile(await p.User.logIn(username,password));},
 async signup({username,email,password,displayName}){const p=await parse();const u=new p.User();u.set({username,email,password,displayName});await u.signUp();if(!u.getSessionToken()){await p.User.logOut();throw new Error('Cadastro recebido. Confirme seu e-mail e depois entre na conta.');}return profile(u);},
 async logout(){const p=await parse();await p.User.logOut();},
 async startMatch(){return (await parse()).Cloud.run('startMatch');},
 async getMatch(id){return (await parse()).Cloud.run('getMatch',{matchId:id});},
 async submitAnswer(params){return (await parse()).Cloud.run('submitAnswer',params);},
 async leaderboard(){return (await parse()).Cloud.run('getLeaderboard');},
 async history(){return (await parse()).Cloud.run('getHistory');}
};
