import playwright from 'playwright'
import mailgun from 'mailgun-js';

const mailgunOptions: mailgun.ConstructorParams = {apiKey: process.env.MAILGUN_APIKEY || 'demo', domain: 'todo.patou.dev', host: "api.eu.mailgun.net"}
const mg = mailgun(mailgunOptions);


const run = async () => {
    if (!process.env.PANIERBIO_LOGIN || !process.env.PANIERBIO_PASSWORD) {
        console.error(`Must set env PANIERBIO_LOGIN and PANIERBIO_PASSWORD`)
        return
    }
    let login :string = process.env.PANIERBIO_LOGIN
    let pass :string = process.env.PANIERBIO_PASSWORD
    let browser = await playwright.chromium.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('https://www.lespaniersbiosolidaires.fr/')
    console.log(await page.title())
    await page.getByRole('link', { name: 'Connexion' }).click();
    await page.waitForLoadState();
    await page.locator('#client_login').fill(login);
    await page.locator('#client_pwd').fill(pass);
    await page.screenshot({ path: 'screen/login2.png' });
    await Promise.all([
        await page.waitForLoadState(),
        await page.locator('#btn_login').click()
    ])
    await page.screenshot({ path: 'screen/login3.png' })
    await page.waitForURL('https://www.lespaniersbiosolidaires.fr/espaceclient');
    console.log(await page.title());
    await page.screenshot({ path: 'screen/account.png' });
    const titre = await page.locator('.pill').innerText()
    console.log(titre)
    const content = await page.locator('.compo-bloc').innerText()
    console.log(content)
    const body = `
Mon panier ${titre}

${content}

-- 
Panier bio solidaire
    `

    const data : mailgun.messages.SendData = {
        from: 'Panier bio solidaire <amp@todo.patou.dev>',
        to: process.env.PANIERBIO_LOGIN,
        subject: `Mon panier ${titre}`,
        text: body,
        'o:dkim': true,
      }
    /*
    const filename = titre.replace('Votre panier du ', "Croq'actus du ").replace(/ 01 /, " 1er ").replace(/ 0([2-9]) /, " $1 ")
    // Si le titre n'est pas renseigné
    if (filename.trim().length > 0) {
      console.log(`Check ... ${filename}`)
      const link = page.getByRole('link', { name: new RegExp(filename, 'gi') })
      if (await link.count() > 0) {
        console.log(`Download ... ${filename}`)
        const [ download ] = await Promise.all([
            // Start waiting for the download
            page.waitForEvent('download'),
            link.click()
        ])
        const path = await download.path();
        console.log(path)
        if (path) {
            data.attachment = new mg.Attachment({
                data: path,
                filename: download.suggestedFilename(),
            })
            data.subject = filename
        }
      }
    }
    */

    if (mailgunOptions.apiKey !== 'demo' && process.env.SEND_EMAIL === 'yes') {
      logEmail("Envoi de l'email", data);
      await mg.messages().send(data);
    }
    else {
      logEmail('Email non envoyé', data);
    }

    await browser.close();
};
run();

function logEmail(msg : string, data : mailgun.messages.SendData) {
  console.log(`${msg} :
à: ${data['to']}
sujet: ${data['subject']}
  
${data['text']?.replaceAll('\\n', '\n')}
${data['attachment'] ? `attachement: ${(data['attachment'] as any).filename}`: ''}
`);
}