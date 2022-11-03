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
    await page.getByRole('link', { name: 'Se connecter' }).click();
    await page.screenshot({ path: 'screen/login1.png' })
    await page.locator('div[role="document"]:has-text("Connexion à votre compte Identifiant / Email Mot de passe Mot de passe oublié ? ") input[name="login"]').fill(login);
    await page.locator('div[role="document"]:has-text("Connexion à votre compte Identifiant / Email Mot de passe Mot de passe oublié ? ") input[name="password"]').fill(pass);
    await page.screenshot({ path: 'screen/login2.png' })
    await Promise.all([
        await page.waitForLoadState(),
        await page.locator('div[role="document"]:has-text("Connexion à votre compte Identifiant / Email Mot de passe Mot de passe oublié ? ")').getByRole('button', { name: 'Se connecter' }).click()
    ])
    await page.screenshot({ path: 'screen/login3.png' })
    
    await page.goto('https://www.lespaniersbiosolidaires.fr/index.php?controleur=compte&action=compositions')
    await page.waitForLoadState()
    await page.screenshot({ path: 'screen/compte.png' })
    console.log(await page.title())
    const titre = await page.locator('section.compte h2.article__titre').innerText()
    console.log(titre)
    const content = await page.locator('section.compte .article__texte').innerText()
    console.log(content)
    const body = `
${titre}

${content}

-- 
Panier bio solidaire
    `

    const data : mailgun.messages.SendData = {
        from: 'Panier bio solidaire <amp@todo.patou.dev>',
        to: process.env.PANIERBIO_LOGIN,
        subject: titre,
        text: body,
        'o:dkim': true,
      }
    const filename = titre.replace('Votre panier du ', "Croq'actus du ").replace(/ 0([1-9]) /, " $1 ")
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
    
      if (mailgunOptions.apiKey !== 'demo') {
        console.log(data)
        await mg.messages().send(data);
      }

    await browser.close();
};
run();
