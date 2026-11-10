// Validação de experiência do usuário. Cloud Code valida novamente no servidor.
export function validateAccount({username,password,displayName}){
 if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(username||''))throw new Error('Usuário: 3 a 24 letras, números, ponto, traço ou sublinhado.');
 if(typeof password!=='string'||password.length<8)throw new Error('Use uma senha com pelo menos 8 caracteres.');
 if(typeof displayName!=='string'||displayName.trim().length<2||displayName.trim().length>32)throw new Error('Apelido: 2 a 32 caracteres.');
}
