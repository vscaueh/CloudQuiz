import {test,expect} from '@playwright/test';
test('treino: partida, resultado, histórico, placar e saída sem anunciar nuvem',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Experimentar modo treino'}).click();
 await expect(page.getByText('Modo treino: respostas')).toBeVisible();
 await page.getByRole('button',{name:'Começar partida',exact:true}).click();
 for(let i=0;i<10;i++){await expect(page.getByText('QUESTÃO '+String(i+1).padStart(2,'0'),{exact:true})).toBeVisible();await page.locator('[data-option="0"]').click();await page.getByRole('button',{name:'Confirmar resposta'}).click();}
 await expect(page.getByText('DESAFIO CONCLUÍDO',{exact:true})).toBeVisible();await expect(page.getByText('Resultado de treino, sem envio à nuvem.')).toBeVisible();
 await page.getByRole('button',{name:'Ver placar do treino',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('button',{name:'Minhas partidas',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByRole('button',{name:'Encerrar treino',exact:true}).click();await expect(page.getByRole('heading',{name:'Pronto para o desafio?'})).toBeVisible();
});
test('tela móvel sem rolagem horizontal e escolha obrigatória',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Experimentar modo treino'}).click();await page.getByRole('button',{name:'Começar partida',exact:true}).click();await expect(page.getByRole('button',{name:'Confirmar resposta'})).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
