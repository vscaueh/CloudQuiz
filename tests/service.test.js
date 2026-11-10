import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createService}=require('../cloud/service.cjs');
const {scoreAnswers,validateQuestion,validateAccount}=require('../cloud/rules.cjs');
const bank=JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url)));
function fixture(){let counter=0;const matches=new Map(),answers=new Map(),scores=new Map();const repo={
 async listQuestions(){return bank.map((q,i)=>({...q,id:'q'+i}));},
 async createMatch(user,questions){const m={id:'m'+counter++,playerId:user.id,nickname:user.nickname,questions,startedAt:new Date()};matches.set(m.id,m);return m;},
 async getMatch(id){return matches.get(id);},
 async getAnswers(id){return [...answers.values()].filter(a=>a.matchId===id);},
 async insertAnswerOnce(m,a){const key=m.id+':'+a.questionId;if(!answers.has(key))answers.set(key,{...a,matchId:m.id});return answers.get(key);},
 async finishOnce(m,stats){if(!scores.has(m.id))scores.set(m.id,{id:'s'+m.id,nickname:m.nickname,...stats,finishedAt:new Date().toISOString()});return scores.get(m.id);},
 async leaderboard(){return [...scores.values()].sort((a,b)=>b.points-a.points).slice(0,10);},
 async history(id){return [...scores.entries()].filter(([key])=>matches.get(key).playerId===id).map(([,v])=>v);}
 };return {service:createService(repo),matches,answers,scores};}
const alice={id:'a',nickname:'Alice'},bob={id:'b',nickname:'Bob'};
describe('CloudQuiz: regras e integração do serviço com repositório',()=>{
 it('mantém banco válido e pelo menos 20 códigos únicos',()=>{expect(bank.length).toBeGreaterThanOrEqual(20);expect(new Set(bank.map(q=>q.code)).size).toBe(bank.length);bank.forEach(validateQuestion);});
 it('rejeita dados de conta inválidos',()=>{expect(()=>validateAccount({username:'aa',password:'x',displayName:'A'})).toThrow();expect(()=>validateAccount({username:'alice',password:'Segura123',displayName:'Alice'})).not.toThrow();});
 it('exige sessão e não revela gabarito nem snapshot privado',async()=>{const {service}=fixture();await expect(service.startMatch(null)).rejects.toThrow();const m=await service.startMatch(alice);expect(m.total).toBe(10);expect(JSON.stringify(m)).not.toContain('correctIndex');expect(m.questions).toBeUndefined();});
 it('impede ler ou responder partida alheia',async()=>{const {service}=fixture();const m=await service.startMatch(alice);await expect(service.getMatch(bob,m.id)).rejects.toThrow('não encontrada');await expect(service.submitAnswer(bob,{matchId:m.id,questionId:m.question.id,selectedIndex:0})).rejects.toThrow('não encontrada');});
 it('rejeita índice, ordem e pergunta inválidos',async()=>{const {service}=fixture();const m=await service.startMatch(alice);for(const index of [-1,4,'1',NaN])await expect(service.submitAnswer(alice,{matchId:m.id,questionId:m.question.id,selectedIndex:index})).rejects.toThrow();await expect(service.submitAnswer(alice,{matchId:m.id,questionId:'inventada',selectedIndex:0})).rejects.toThrow();});
 it('finaliza dez acertos, ignora pontuação do cliente e persiste uma vez',async()=>{const f=fixture();let m=await f.service.startMatch(alice);const privateMatch=f.matches.get(m.id);for(let i=0;i<10;i++){const q=privateMatch.questions[i];const response=await f.service.submitAnswer(alice,{matchId:m.id,questionId:q.id,selectedIndex:q.correctIndex,points:999999});m=response.match;}expect(m.status).toBe('completed');expect(m.points).toBe(1000);expect(m.result.correctCount).toBe(10);await f.service.getMatch(alice,m.id);await f.service.getMatch(alice,m.id);expect(f.scores.size).toBe(1);expect((await f.service.history(bob)).length).toBe(0);expect((await f.service.leaderboard(alice))[0].points).toBe(1000);});
 it('reenvio idêntico não pontua duas vezes e alteração posterior é rejeitada',async()=>{const f=fixture();const m=await f.service.startMatch(alice);const q=f.matches.get(m.id).questions[0],payload={matchId:m.id,questionId:q.id,selectedIndex:q.correctIndex};await f.service.submitAnswer(alice,payload);const response=await f.service.submitAnswer(alice,payload);expect(response.match.answeredCount).toBe(1);expect(response.match.points).toBe(100);await expect(f.service.submitAnswer(alice,{...payload,selectedIndex:(q.correctIndex+1)%4})).rejects.toThrow('já foi respondida');});
 it('simula o contrato de unicidade do banco em submissões concorrentes',async()=>{const f=fixture();const m=await f.service.startMatch(alice);const q=f.matches.get(m.id).questions[0];const results=await Promise.allSettled([f.service.submitAnswer(alice,{matchId:m.id,questionId:q.id,selectedIndex:q.correctIndex}),f.service.submitAnswer(alice,{matchId:m.id,questionId:q.id,selectedIndex:(q.correctIndex+1)%4})]);expect(f.answers.size).toBe(1);expect(results.filter(r=>r.status==='fulfilled').length).toBe(1);});
 it('zero acertos produz zero pontos e tamanho do jogo é respeitado',()=>{expect(scoreAnswers(Array.from({length:10},(_,i)=>({questionId:i,isCorrect:false}))).points).toBe(0);expect(()=>scoreAnswers(Array.from({length:11},(_,i)=>({questionId:i,isCorrect:true})))).toThrow();});
});
