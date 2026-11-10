import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 for(const key of Object.keys({...env,...process.env}))if(/^VITE_.*(MASTER|SECRET|DATABASE_URI|PASSWORD)/i.test(key))throw new Error('Nunca configure segredos com prefixo VITE_.');
 if(process.env.REQUIRE_CLOUD_CONFIG==='1'&&!(env.VITE_PARSE_APP_ID||process.env.VITE_PARSE_APP_ID))throw new Error('Configure VITE_PARSE_APP_ID antes de publicar.');
 if(process.env.REQUIRE_CLOUD_CONFIG==='1'&&!(env.VITE_PARSE_JAVASCRIPT_KEY||process.env.VITE_PARSE_JAVASCRIPT_KEY))throw new Error('Configure VITE_PARSE_JAVASCRIPT_KEY antes de publicar.');
 return {test:{include:['tests/**/*.test.js']},build:{chunkSizeWarningLimit:650}};
});
