// CloudQuiz - gerado por scripts/bundle-cloud.mjs
const _rules = (()=>{const module={exports:{}};
const ROUND_SIZE = 10;
const POINTS_PER_CORRECT = 100;
function validIndex(index) { return Number.isInteger(index) && index >= 0 && index < 4; }
function validateQuestion(q) {
  if (!q || typeof q.statement !== 'string' || !q.statement.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some(x=>typeof x!=='string'||!x.trim()) || !validIndex(q.correctIndex)) throw new Error('Questão inválida.');
}
function publicQuestion(q, index) { return { id: q.id, statement: q.statement, options: [...q.options], topic: q.topic, index }; }
function scoreAnswers(answers) {
  const seen=new Set();let correctCount=0;
  for(const a of answers) { if(!seen.has(a.questionId)) {seen.add(a.questionId);if(a.isCorrect)correctCount++;} }
  if(seen.size>ROUND_SIZE)throw new Error('Partida com respostas além do limite.');
  return {correctCount,points:correctCount*POINTS_PER_CORRECT,answeredCount:seen.size};
}
function validateIdentity({username,displayName}) {
  if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(username||''))throw new Error('Usuário: 3 a 24 letras, números, ponto, traço ou sublinhado.');
  if(typeof displayName!=='string'||displayName.trim().length<2||displayName.trim().length>32)throw new Error('Apelido: 2 a 32 caracteres.');
}
function validateAccount(values){validateIdentity(values);if(typeof values.password!=='string'||values.password.length<8)throw new Error('Use uma senha com pelo menos 8 caracteres.');}
module.exports={ROUND_SIZE,POINTS_PER_CORRECT,validIndex,validateQuestion,publicQuestion,scoreAnswers,validateAccount,validateIdentity};

return module.exports;})();
const _service = (()=>{const module={exports:{}};
const {randomInt}=require('node:crypto');
const {ROUND_SIZE,validIndex,validateQuestion,publicQuestion,scoreAnswers}=_rules;
function shuffle(list) { const r=[...list];for(let i=r.length-1;i>0;i--){const j=randomInt(i+1);[r[i],r[j]]=[r[j],r[i]];}return r; }
function createService(repo) {
  function requireUser(user) { if(!user?.id)throw new Error('Entre na sua conta para continuar.'); }
  async function owned(user,id) {requireUser(user);if(typeof id!=='string'||!id)throw new Error('Partida inválida.');const m=await repo.getMatch(id);if(!m||m.playerId!==user.id)throw new Error('Partida não encontrada.');return m;}
  async function snapshot(m) {
    const answers=await repo.getAnswers(m.id), stats=scoreAnswers(answers);
    const finished=stats.answeredCount===ROUND_SIZE;
    let result=null;
    if(finished) {
      result=await repo.finishOnce(m,stats); // índice único no banco garante um resultado por partida
    }
    return {id:m.id,total:ROUND_SIZE,status:finished?'completed':'active',...stats,question:finished?null:publicQuestion(m.questions[stats.answeredCount],stats.answeredCount),result};
  }
  return {
    async startMatch(user) {
      requireUser(user);const questions=await repo.listQuestions();
      if(questions.length<ROUND_SIZE)throw new Error('O banco precisa de pelo menos 10 perguntas ativas.');
      questions.forEach(validateQuestion);
      const match=await repo.createMatch(user,shuffle(questions).slice(0,ROUND_SIZE));
      return snapshot(match);
    },
    async getMatch(user,id) {return snapshot(await owned(user,id));},
    async submitAnswer(user,{matchId,questionId,selectedIndex}) {
      const m=await owned(user,matchId);
      if(!validIndex(selectedIndex))throw new Error('Selecione uma das quatro alternativas.');
      const answers=await repo.getAnswers(m.id), previous=answers.find(a=>a.questionId===questionId);
      if(previous) {if(previous.selectedIndex!==selectedIndex)throw new Error('Essa questão já foi respondida.');return {accepted:true,isCorrect:previous.isCorrect,match:await snapshot(m)};}
      const q=m.questions[answers.length];
      if(!q||q.id!==questionId)throw new Error('Questão fora de ordem ou partida já concluída.');
      const stored=await repo.insertAnswerOnce(m,{questionId,selectedIndex,isCorrect:q.correctIndex===selectedIndex});
      if(stored.selectedIndex!==selectedIndex)throw new Error('Essa questão já foi respondida em outra janela.');
      return {accepted:true,isCorrect:stored.isCorrect,match:await snapshot(m)};
    },
    async leaderboard(user) {requireUser(user);return repo.leaderboard();},
    async history(user) {requireUser(user);return repo.history(user.id);}
  };
}
module.exports={createService};

return module.exports;})();
const _repository = (()=>{const module={exports:{}};
function createRepository(Parse) {
  const master={useMasterKey:true};
  const ptr=(name,id)=>Parse.Object.createWithoutData(name,id);
  const matchData=o=>({id:o.id,playerId:o.get('player').id,nickname:o.get('nickname'),questions:o.get('questionSet'),startedAt:o.createdAt});
  const answerData=o=>({questionId:o.get('questionId'),selectedIndex:o.get('selectedIndex'),isCorrect:o.get('isCorrect')});
  const resultData=o=>({id:o.id,matchId:o.get('match').id,nickname:o.get('nicknameSnapshot'),points:o.get('points'),correctCount:o.get('correctCount'),finishedAt:o.createdAt.toISOString()});
  async function first(className,key,value){return new Parse.Query(className).equalTo(key,value).first(master);}
  return {
    async listQuestions(){return (await new Parse.Query('Question').equalTo('active',true).limit(1000).find(master)).map(o=>({id:o.id,statement:o.get('statement'),options:o.get('options'),correctIndex:o.get('correctIndex'),topic:o.get('topic')}));},
    async createMatch(user,questions){const m=new Parse.Object('Match');m.set({player:ptr('_User',user.id),nickname:user.nickname,questionSet:questions,status:'active'});m.setACL(new Parse.ACL());await m.save(null,master);return matchData(m);},
    async getMatch(id){try{return matchData(await new Parse.Query('Match').get(id,master));}catch(e){if(e.code===101)return null;throw e;}},
    async getAnswers(id){return (await new Parse.Query('Answer').equalTo('match',ptr('Match',id)).ascending('createdAt').limit(10).find(master)).map(answerData);},
    async insertAnswerOnce(m,a){const key=m.id+':'+a.questionId;let o=await first('Answer','dedupeKey',key);if(o)return answerData(o);o=new Parse.Object('Answer');o.set({match:ptr('Match',m.id),player:ptr('_User',m.playerId),dedupeKey:key,...a});o.setACL(new Parse.ACL());try{await o.save(null,master);}catch(e){const existing=await first('Answer','dedupeKey',key);if(existing)return answerData(existing);throw e;}return answerData(o);},
    async finishOnce(m,stats){let score=await first('Score','matchKey',m.id);if(!score){score=new Parse.Object('Score');score.set({player:ptr('_User',m.playerId),match:ptr('Match',m.id),matchKey:m.id,nicknameSnapshot:m.nickname,points:stats.points,correctCount:stats.correctCount});score.setACL(new Parse.ACL());try{await score.save(null,master);}catch(e){const existing=await first('Score','matchKey',m.id);if(!existing)throw e;score=existing;}}
      const row=ptr('Match',m.id);row.set({status:'completed',score:score.get('points'),answeredCount:10,finishedAt:score.createdAt});await row.save(null,master);return resultData(score);},
    async leaderboard(){return (await new Parse.Query('Score').descending('points').addAscending('createdAt').limit(10).find(master)).map(resultData);},
    async history(id){return (await new Parse.Query('Score').equalTo('player',ptr('_User',id)).descending('createdAt').limit(20).find(master)).map(resultData);}
  };
}
module.exports={createRepository};

return module.exports;})();
/* Copie todos os .cjs e este main.js para cloud/ no Back4App. */
const {createService}=_service;
const {createRepository}=_repository;
const {validateAccount,validateIdentity}=_rules;
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
