function createRepository(Parse) {
  const master={useMasterKey:true};
  const ptr=(name,id)=>{const object=new Parse.Object(name);object.id=id;return object;};
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
