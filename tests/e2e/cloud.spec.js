import {test,expect} from '@playwright/test';
const enabled=Boolean(process.env.CLOUDQUIZ_TEST_USERNAME&&process.env.CLOUDQUIZ_TEST_PASSWORD);
test('Back4App real: login, salvar partida, placar, restauração e logout',async({page})=>{
 test.skip(!enabled,'Configure uma conta de teste dedicada e as chaves públicas do app.');
 await page.goto('/');await page.getByLabel('Usuário',{exact:true}).fill(process.env.CLOUDQUIZ_TEST_USERNAME);await page.getByLabel('Senha',{exact:true}).fill(process.env.CLOUDQUIZ_TEST_PASSWORD);await page.getByRole('button',{name:'Entrar e jogar'}).click();
 await expect(page.getByRole('heading',{name:/Olá,/})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:/Olá,/})).toBeVisible();await page.getByRole('button',{name:'Começar partida',exact:true}).click();
 for(let i=0;i<10;i++){await expect(page.getByText('QUESTÃO '+String(i+1).padStart(2,'0'),{exact:true})).toBeVisible();await page.locator('[data-option="0"]').click();await page.getByRole('button',{name:'Confirmar resposta'}).click();}
 await expect(page.getByText('Seu resultado foi confirmado e salvo no Back4App.')).toBeVisible();await page.getByRole('button',{name:'Ver ranking global',exact:true}).click();await expect(page.locator('tbody tr').first()).toBeVisible();await page.getByRole('button',{name:'Minhas partidas',exact:true}).click();await expect(page.locator('tbody tr').first()).toBeVisible();await page.getByRole('button',{name:'Sair',exact:true}).click();await expect(page.getByRole('heading',{name:'Pronto para o desafio?'})).toBeVisible();
});
