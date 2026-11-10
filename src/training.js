// Banco exclusivo de treino. O banco de avaliação real fica em data/questions.json no servidor.
const bank=[
 ['Qual ação ajuda a proteger sua conta?',['Compartilhar a senha','Usar uma senha forte','Publicar credenciais','Desativar o login'],1],
 ['Um navegador é usado para...',['Acessar páginas Web','Substituir a internet','Criar discos físicos','Fornecer energia'],0],
 ['Qual destes é um arquivo de imagem?',['foto.png','senha.exe','dados.sql','script.js'],0],
 ['Uma cópia de segurança serve para...',['Apagar tudo','Impedir acesso','Recuperar informações','Aumentar o monitor'],2],
 ['Qual atitude evita perda de trabalho?',['Nunca salvar','Salvar e versionar','Reutilizar qualquer senha','Fechar durante upload'],1],
 ['Uma mensagem de erro de rede pede...',['Ignorar o problema','Alterar os pontos','Conferir a conexão','Divulgar a senha'],2],
 ['Qual dado deve permanecer privado?',['Nome do jogo','Regras públicas','Título da página','Senha'],3],
 ['O que é um placar?',['Uma lista de pontuações','Um arquivo de áudio','Uma senha de acesso','Um editor de código'],0],
 ['O que um botão Sair normalmente faz?',['Apaga o site','Encerra a sessão','Publica a senha','Troca o servidor'],1],
 ['Qual atividade ajuda a encontrar defeitos?',['Pular revisões','Ocultar mensagens','Realizar testes','Desativar validações'],2]
].map(([statement,options,correctIndex],i)=>({id:'training-'+i,statement,options,correctIndex,topic:'Treino'}));
export function createTrainingApi(){let match=null,results=[];const nickname='Explorador';
 function snapshot(){const n=match.answers.length,correct=match.answers.filter(x=>x).length;return {id:match.id,status:n===10?'completed':'active',answeredCount:n,correctCount:correct,points:correct*100,total:10,question:n===10?null:{id:bank[n].id,statement:bank[n].statement,options:bank[n].options,topic:'Treino',index:n},result:n===10?results[0]:null};}
 return {mode:'training',async logout(){match=null;results=[];},async startMatch(){match={id:crypto.randomUUID(),answers:[]};return snapshot();},async getMatch(id){if(match?.id!==id)throw new Error('Treino encerrado. Inicie outra partida.');return snapshot();},async submitAnswer({questionId,selectedIndex}){const q=bank[match.answers.length];if(!q||q.id!==questionId)throw new Error('Pergunta inválida.');const isCorrect=q.correctIndex===selectedIndex;match.answers.push(isCorrect);if(match.answers.length===10){const correct=match.answers.filter(Boolean).length;results.unshift({id:match.id,nickname,points:correct*100,correctCount:correct,finishedAt:new Date().toISOString()});}return {isCorrect,match:snapshot()};},async history(){return [...results];},async leaderboard(){return [...results].sort((a,b)=>b.points-a.points).slice(0,10);}};
}
