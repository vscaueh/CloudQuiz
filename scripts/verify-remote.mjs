import Parse from 'parse/node';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
Parse.initialize(process.env.PARSE_APP_ID,process.env.PARSE_JAVASCRIPT_KEY,process.env.PARSE_MASTER_KEY);Parse.serverURL=process.env.PARSE_SERVER_URL;
const master={useMasterKey:true};const assert=(v,message)=>{if(!v)throw new Error(message);};
const stamp=Date.now().toString(36), password=randomBytes(18).toString('base64url');
async function create(suffix){const u=new Parse.User();u.set({username:`cqteste_${stamp}_${suffix}`,email:`cqteste_${stamp}_${suffix}@example.invalid`,password,displayName:`Validação ${suffix}`});await u.signUp();return u;}
async function run(){
 let anonDenied=false;try{await Parse.Cloud.run('getPlayer',{}, {sessionToken:'invalid-token-test'});}catch{anonDenied=true;}assert(anonDenied,'Anon session accepted');
 const a=process.env.CLOUDQUIZ_TEST_USERNAME?await Parse.User.logIn(process.env.CLOUDQUIZ_TEST_USERNAME,process.env.CLOUDQUIZ_TEST_PASSWORD):await create('A'),b=await create('B');
 const opts={sessionToken:a.getSessionToken()},optsB={sessionToken:b.getSessionToken()};
 if(!process.env.CLOUDQUIZ_TEST_USERNAME)await fs.writeFile(new URL('../.env.test',import.meta.url),`CLOUDQUIZ_TEST_USERNAME=${a.getUsername()}\nCLOUDQUIZ_TEST_PASSWORD=${password}\n`);
 const player=await Parse.Cloud.run('getPlayer',{},opts);assert(player.id===a.id,'Sessão incorreta');
 let m=await Parse.Cloud.run('startMatch',{},opts);
 assert(!JSON.stringify(m).includes('correctIndex'),'Gabarito exposto');
 let denied=false;try{await Parse.Cloud.run('getMatch',{matchId:m.id},optsB);}catch{denied=true;}assert(denied,'Acesso entre contas');
 denied=false;try{await new Parse.Query('Question').find(opts);}catch{denied=true;}assert(denied,'Classe de perguntas exposta');
 const stored=await new Parse.Query('Match').get(m.id,master);const questions=stored.get('questionSet');
 for(let i=0;i<10;i++){
  const q=questions[i],params={matchId:m.id,questionId:q.id,selectedIndex:q.correctIndex};
  const result=await Parse.Cloud.run('submitAnswer',params,opts);m=result.match;
  const repeated=await Parse.Cloud.run('submitAnswer',params,opts);assert(repeated.match.answeredCount===i+1,'Resposta duplicada');
  if(i===0){denied=false;try{await Parse.Cloud.run('submitAnswer',{...params,selectedIndex:(q.correctIndex+1)%4},opts);}catch{denied=true;}assert(denied,'Resposta posterior alterada');}
 }
 assert(m.points===1000&&m.status==='completed','Pontuação final incorreta');
 await Parse.Cloud.run('getMatch',{matchId:m.id},opts);
 assert(await new Parse.Query('Score').equalTo('matchKey',m.id).count(master)===1,'Score duplicado');
 const ranking=await Parse.Cloud.run('getLeaderboard',{},opts);assert(ranking.some(r=>r.matchId===m.id),'Ranking sem resultado');assert(!JSON.stringify(ranking).includes('@'),'Ranking com e-mail');
 const my=await Parse.Cloud.run('getHistory',{},opts);assert(my.some(r=>r.matchId===m.id),'Histórico ausente');
 const probe=new Parse.Object('Answer');probe.set({dedupeKey:'probe-'+stamp,questionId:'probe',selectedIndex:0,isCorrect:false});await probe.save(null,master);
 const duplicate=new Parse.Object('Answer');duplicate.set({dedupeKey:'probe-'+stamp,questionId:'probe',selectedIndex:0,isCorrect:false});denied=false;try{await duplicate.save(null,master);}catch{denied=true;}assert(denied,'Índice único Answer ausente');await probe.destroy(master);
 const report={date:new Date().toISOString(),passed:['sessão','partida de dez questões','gabarito privado','acesso entre contas negado','consulta direta negada','reenvio sem duplicar','alteração de resposta negada','1000 pontos corretos','Score único','ranking e histórico','índice único Answer'],testUser:a.getUsername(),matchId:m.id};
 await fs.writeFile(new URL('../docs/remote-verification.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}
run().catch(e=>{console.error(JSON.stringify({code:e.code||null,message:e.message}));process.exitCode=1;});
