import Parse from 'parse/node';
import {MongoClient} from 'mongodb';
import fs from 'node:fs/promises';
import rules from '../cloud/rules.cjs';
const env=process.env;
for(const name of ['PARSE_APP_ID','PARSE_MASTER_KEY'])if(!env[name]){console.error(`Defina ${name} no ambiente administrativo. Leia docs/BACK4APP.md.`);process.exit(1);}
Parse.initialize(env.PARSE_APP_ID,env.PARSE_JAVASCRIPT_KEY||undefined,env.PARSE_MASTER_KEY);Parse.serverURL=env.PARSE_SERVER_URL||'https://parseapi.back4app.com';
const fields={
 Question:{code:'String',statement:'String',options:'Array',correctIndex:'Number',topic:'String',active:'Boolean'},
 Match:{player:'Pointer:_User',nickname:'String',questionSet:'Array',status:'String',score:'Number',answeredCount:'Number',finishedAt:'Date'},
 Answer:{player:'Pointer:_User',match:'Pointer:Match',dedupeKey:'String',questionId:'String',selectedIndex:'Number',isCorrect:'Boolean'},
 Score:{player:'Pointer:_User',match:'Pointer:Match',matchKey:'String',nicknameSnapshot:'String',points:'Number',correctCount:'Number'}
};
async function setup(){
 for(const [name,columns] of Object.entries(fields)){
  const schema=new Parse.Schema(name);let existing;
  try{existing=await schema.get();}catch(e){if(![101,103].includes(e.code))throw e;}
  for(const [key,type] of Object.entries(columns))if(!existing?.fields?.[key]){
   if(type.startsWith('Pointer:'))schema.addPointer(key,type.split(':')[1]);else schema['add'+type](key);
  }
  schema.setCLP({find:{},get:{},create:{},update:{},delete:{},addField:{},count:{}});
  if(existing)await schema.update();else await schema.save();
  console.log(`Classe ${name}: criada/verificada e acesso direto bloqueado.`);
 }
 // Índices únicos reais, não apenas uma verificação antes da escrita.
 // URI deve apontar ao banco deste app (Core Settings / Database URI).
 if(env.BACK4APP_DATABASE_URI){
 const client=new MongoClient(env.BACK4APP_DATABASE_URI,{serverSelectionTimeoutMS:15000});
 try{await client.connect();const db=client.db();
  await db.collection('Answer').createIndex({dedupeKey:1},{unique:true,name:'cloudquiz_unique_answer'});
  await db.collection('Score').createIndex({matchKey:1},{unique:true,name:'cloudquiz_unique_score'});
  await db.collection('Question').createIndex({code:1},{unique:true,name:'cloudquiz_question_code'});
  await db.collection('Score').createIndex({points:-1,_created_at:1},{name:'cloudquiz_ranking'});
  console.log('Índices únicos e de ranking confirmados.');
 }finally{await client.close();}
 }else{console.log('Índices ainda não instalados: use Database / Index Manager no painel (Unique=true).');process.exitCode=2;}
 const userSchema=new Parse.Schema('_User');const current=await userSchema.get();if(!current.fields.displayName)userSchema.addString('displayName');
 userSchema.setCLP({find:{},get:{},create:{'*':true},update:{},delete:{},addField:{},count:{}});await userSchema.update();
 const questions=JSON.parse(await fs.readFile(new URL('../data/questions.json',import.meta.url),'utf8'));
 for(const q of questions){rules.validateQuestion(q);let row=await new Parse.Query('Question').equalTo('code',q.code).first({useMasterKey:true});if(!row)row=new Parse.Object('Question');row.set(q);row.setACL(new Parse.ACL());await row.save(null,{useMasterKey:true});}
 console.log(`${questions.length} questões revisadas e carregadas. Agora publique cloud/main.js e os arquivos .cjs pelo painel.`);
}
setup().catch(e=>{console.error(`Configuração não concluída (código ${e.code||'indisponível'}). Confira as credenciais, a URI, as permissões e a documentação. Não desative as regras para contornar erros.`);process.exitCode=1;});
