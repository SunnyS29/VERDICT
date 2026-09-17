import {test,expect} from '@playwright/test';
const next=page=>page.getByRole('button',{name:'Next →'}).click();
const finish=page=>page.getByRole('button',{name:'Get my answer →'});
async function weigh(page,n=3){
 await page.getByRole('button',{name:'Weigh what matters →'}).click();
 for(let i=0;i<n*(n-1)/2;i++)await page.getByRole('button',{name:/matter equally$/}).click();
}
async function setup(page,names=['Alpha','Beta'],priorities=[['Quality','scale'],['Comfort','scale'],['Feature','yesno']]){
 await page.goto('./');
 for(const name of names){await page.locator('#vd-opt').fill(name);await page.locator('#vd-opt').press('Enter');}
 for(const [name,type] of priorities){
  await page.getByRole('combobox').selectOption(type);
  await page.locator('#vd-criterion').fill(name);await page.locator('#vd-criterion').press('Enter');
 }
 await weigh(page,priorities.length);
}
test('sample completes with prefilled values and no runtime errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await page.getByRole('button',{name:'Load the ereader example'}).click();await weigh(page,5);
 await expect(page.getByRole('spinbutton').first()).toHaveValue('269');
 for(let i=0;i<4;i++)await next(page);await finish(page).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your leading option.');
 await expect(page.locator('.vd-win-name')).not.toBeEmpty();
 await expect(page.locator('main')).not.toContainText('NaN');expect(errors).toEqual([]);
});
test('identical options produce a tie, without an arbitrary runner-up',async({page})=>{
 await setup(page,['Alpha','Beta'],[['Quality','scale'],['Comfort','scale'],['Looks','scale']]);
 await next(page);await next(page);await finish(page).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('No single winner.');
 await expect(page.locator('.vd-win-name')).toHaveText('Alpha / Beta');
 await expect(page.locator('.vd-meter-row').first()).toContainText('50 / 100');
 await expect(page.locator('.vd-runner')).toHaveCount(0);
});
test('unanswered yes/no is required and explicit No is accessible',async({page})=>{
 await setup(page);await next(page);await next(page);await expect(finish(page)).toBeDisabled();
 const alpha=page.getByRole('group',{name:'Alpha: Feature'}),beta=page.getByRole('group',{name:'Beta: Feature'});
 await expect(alpha.getByRole('button',{name:'No',exact:true})).toHaveAttribute('aria-pressed','false');
 await alpha.getByRole('button',{name:'Yes',exact:true}).click();await expect(finish(page)).toBeDisabled();
 await beta.getByRole('button',{name:'No',exact:true}).click();
 await expect(beta.getByRole('button',{name:'No',exact:true})).toHaveAttribute('aria-pressed','true');
 await finish(page).click();await expect(page.locator('.vd-win-name')).toHaveText('Alpha');
});
test('zero, decimals, edited ratings and changed options preserve valid input',async({page})=>{
 await setup(page,['Alpha','Beta'],[['Price','number-low'],['Quality','scale'],['Comfort','scale']]);
 await expect(page.getByRole('button',{name:'Next →'})).toBeDisabled();
 await page.getByRole('spinbutton',{name:'Alpha: Price'}).fill('0');await page.getByRole('spinbutton',{name:'Beta: Price'}).fill('10.5');
 await next(page);await next(page);await finish(page).click();await expect(page.locator('.vd-win-name')).toHaveText('Alpha');
 await page.getByRole('button',{name:'Edit ratings'}).click();
 await expect(page.getByRole('spinbutton',{name:'Alpha: Price'})).toHaveValue('0');
 await page.getByRole('spinbutton',{name:'Alpha: Price'}).fill('100');
 await next(page);await next(page);await finish(page).click();await expect(page.locator('.vd-win-name')).toHaveText('Beta');
 await page.getByRole('button',{name:'Edit decision',exact:true}).click();
 await page.getByRole('button',{name:'Remove Beta'}).click();
 await page.locator('#vd-opt').fill('Gamma');await page.locator('#vd-opt').press('Enter');await weigh(page);
 await expect(page.getByRole('spinbutton',{name:'Alpha: Price'})).toHaveValue('100');
 await expect(page.getByRole('spinbutton',{name:'Gamma: Price'})).toHaveValue('');
 await expect(page.getByRole('button',{name:'Next →'})).toBeDisabled();
});
test('back navigation preserves setup and moves focus to the question',async({page})=>{
 await setup(page);await expect(page.getByRole('heading',{level:1})).toBeFocused();
 await page.getByRole('button',{name:'← Back',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Which matters more?');
 await page.getByRole('button',{name:'← Back a question'}).click();await page.getByRole('button',{name:'← Back a question'}).click();
 await page.getByRole('button',{name:'← Edit decision'}).click();await expect(page.locator('.vd-tag')).toHaveCount(5);
});
test('long names wrap and user HTML stays text',async({page})=>{
 await setup(page,['A'.repeat(100),'<img src=x onerror="window.injected=true">'],[['C'.repeat(100),'scale'],['Comfort','scale'],['Quality','scale']]);
 await next(page);await next(page);await finish(page).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('No single winner.');
 expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('main img')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
