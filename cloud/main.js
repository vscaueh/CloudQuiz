/* Copie todos os .cjs e este main.js para cloud/ no Back4App. */
const {createService}=require('./service.cjs');
const {createRepository}=require('./repository.cjs');
const {validateAccount,validateIdentity}=require('./rules.cjs');
const service=createService(createRepository(Parse));
const user=r=>{if(!r.user)throw new Parse.Error(209,'Entre na sua conta.');return {id:r.user.id,nickname:r.user.get('displayName')||r.user.getUsername()};};
function define(name,fn){Parse.Cloud.define(name,async r=>{try{return await fn(r);}catch(e){if(e instanceof Parse.Error)throw e;throw new Parse.Error(141,e.message);}});}
define('startMatch',r=>service.startMatch(user(r)));
define('getPlayer',r=>user(r));
define('getMatch',r=>service.getMatch(user(r),r.params.matchId));
define('submitAnswer',r=>service.submitAnswer(user(r),r.params));
define('getLeaderboard',r=>service.leaderboard(user(r)));
define('getHistory',r=>service.history(user(r)));
// Nem chamadas REST diretas podem alterar essas classes usando uma chave cliente.
for(const name of ['Question','Match','Answer','Score']){
  Parse.Cloud.beforeSave(name,r=>{if(!r.master)throw new Parse.Error(119,'Somente o servidor pode gravar esses dados.');});
  Parse.Cloud.beforeDelete(name,r=>{if(!r.master)throw new Parse.Error(119,'Exclusão não permitida.');});
  Parse.Cloud.beforeFind(name,r=>{if(!r.master)throw new Parse.Error(119,'Use as funções autorizadas do jogo.');});
}
Parse.Cloud.beforeSave(Parse.User,r=>{
  if(r.master)return;
  const u=r.object;
  if(!r.original){
    const values={username:u.getUsername(),password:u.get('password'),displayName:u.get('displayName')};
    validateIdentity(values);
    // Algumas versões do Parse removem a senha dos objetos do trigger.
    // Configure também passwordPolicy.minPasswordLength=8 no servidor.
    if(values.password!==undefined)validateAccount(values);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.getEmail()||''))throw new Parse.Error(142,'Informe um e-mail válido.');
  }
  else {const nickname=u.get('displayName');if(typeof nickname!=='string'||nickname.trim().length<2||nickname.trim().length>32)throw new Parse.Error(142,'Apelido inválido.');}
});
