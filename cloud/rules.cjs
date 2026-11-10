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
