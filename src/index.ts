import playwright from 'playwright'

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
    console.log(await page.locator('section.compte h2.article__titre').innerText())
    console.log(await page.locator('section.compte .article__texte').innerText())

    await browser.close();
};
run();
