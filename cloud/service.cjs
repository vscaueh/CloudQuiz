const {randomInt}=require('node:crypto');
const {ROUND_SIZE,validIndex,validateQuestion,publicQuestion,scoreAnswers}=require('./rules.cjs');
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
