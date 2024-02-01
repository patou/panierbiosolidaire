import playwright from 'playwright'
import FormData from 'form-data';
import Mailgun, { MailgunMessageData } from 'mailgun.js';
import { cp } from 'fs';

const mailgun = new Mailgun(FormData);
const mailgunOptions = { username: 'api', key: process.env.MAILGUN_APIKEY || 'demo', url: "https://api.eu.mailgun.net" }
const mg = mailgun.client(mailgunOptions);


const run = async () => {
  if (!process.env.PANIERBIO_LOGIN || !process.env.PANIERBIO_PASSWORD) {
    console.error(`Must set env PANIERBIO_LOGIN and PANIERBIO_PASSWORD`)
    return
  }
  let login: string = process.env.PANIERBIO_LOGIN
  let pass: string = process.env.PANIERBIO_PASSWORD
  let browser = await playwright.chromium.launch({ headless: true });
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
  const content = await page.locator('.compo-bloc')
  const contentText = await content.innerText();
  const contentHtml = await content.innerHTML();
  console.log(content)
  const text = `
Mon panier ${titre}

${contentText}

-- 
Panier bio solidaire
    `

  const html = generateHtmlEmail(titre, contentHtml)

  const data: MailgunMessageData = {
    from: 'Panier bio solidaire <amp@todo.patou.dev>',
    to: process.env.PANIERBIO_LOGIN,
    subject: `Mon panier ${titre}`,
    text,
    html,
    'o:dkim': true,
  }
  await page.getByRole('tab', { name: "Les croq'actus" }).click();
  
  const jeudi = getNextDayOfTheWeek('thu').toLocaleDateString('fr', {month:'2-digit', day:'2-digit', year:'2-digit' });
  const croqActusLocator = page.getByText(jeudi)
  const hasCroqActus = await croqActusLocator.isVisible();
  if (hasCroqActus) {
    console.log(`Un Croq'actus pour ${jeudi} est disponible`);
    const row = await page
      .locator("tr", { has: croqActusLocator });
    const button = row.getByRole("button");
    console.log(await button.getAttribute("title"));
      //.getByRole("button", { name: "edit" });
    const [ download ] = await Promise.all([
        // Start waiting for the download
        page.waitForEvent('download'),
        button.click()
    ])
    const path = await download.path();
    console.log(path)
    if (path) {
      const readStream = await download.createReadStream();
      const contentData = await readAllFromStream(readStream);
      data.attachment = {
          data: contentData,
          filename: download.suggestedFilename(),
      }
      data.subject = `Mon Croq'actus ${titre}`;
    }
    
    //console.log(await button.getAttribute("title"))
  }
  else {
    console.log(`Un Croq'actus pour ${jeudi} n'est pas disponible`);
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

  if (mailgunOptions.key !== 'demo' && process.env.SEND_EMAIL === 'yes') {
    logEmail("Envoi de l'email", data);
    await mg.messages.create('todo.patou.dev', data);
  }
  else {
    logEmail('Email non envoyé', data);
  }

  await browser.close();
};
run();

function logEmail(msg: string, data: MailgunMessageData) {
  console.log(`${msg} :
à: ${data['to']}
sujet: ${data['subject']}
  
${data['text']?.replaceAll('\\n', '\n')}
${data['attachment'] ? `attachement: ${(data['attachment'] as any).filename}` : ''}
`);
}

function getNextDayOfTheWeek(dayName: string, excludeToday = false, refDate = new Date()): Date {
  const dayOfWeek = ["sun","mon","tue","wed","thu","fri","sat"]
                    .indexOf(dayName.slice(0,3).toLowerCase());
  if (dayOfWeek < 0) return refDate;
  refDate.setHours(0,0,0,0);
  refDate.setDate(refDate.getDate() + +!!excludeToday + 
                  (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
  return refDate;
}

function generateHtmlEmail(titre: string, contentHtml: string) {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Simple Transactional Email</title>
      <style media="all" type="text/css">
      /* -------------------------------------
      GLOBAL RESETS
  ------------------------------------- */
      
      body {
        font-family: Helvetica, sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 16px;
        line-height: 1.3;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      
      table {
        border-collapse: separate;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        width: 100%;
      }
      
      table td {
        font-family: Helvetica, sans-serif;
        font-size: 16px;
        vertical-align: top;
      }
      /* -------------------------------------
      BODY & CONTAINER
  ------------------------------------- */
      
      body {
        background-color: #f4f5f6;
        margin: 0;
        padding: 0;
      }
      
      .body {
        background-color: #f4f5f6;
        width: 100%;
      }
      
      .container {
        margin: 0 auto !important;
        max-width: 600px;
        padding: 0;
        padding-top: 24px;
        width: 600px;
      }
      
      .content {
        box-sizing: border-box;
        display: block;
        margin: 0 auto;
        max-width: 600px;
        padding: 0;
      }
      /* -------------------------------------
      HEADER, FOOTER, MAIN
  ------------------------------------- */
      
      .main {
        background: #ffffff;
        border: 1px solid #eaebed;
        border-radius: 16px;
        width: 100%;
      }
      
      .wrapper {
        box-sizing: border-box;
        padding: 24px;
      }
      
      .footer {
        clear: both;
        padding-top: 24px;
        text-align: center;
        width: 100%;
      }
      
      .footer td,
      .footer p,
      .footer span,
      .footer a {
        color: #9a9ea6;
        font-size: 16px;
        text-align: center;
      }
      /* -------------------------------------
      TYPOGRAPHY
  ------------------------------------- */
      
      p {
        font-family: Helvetica, sans-serif;
        font-size: 16px;
        font-weight: normal;
        margin: 0;
        margin-bottom: 16px;
      }
      
      a {
        color: #0867ec;
        text-decoration: underline;
      }
      /* -------------------------------------
      BUTTONS
  ------------------------------------- */
      
      .btn {
        box-sizing: border-box;
        min-width: 100% !important;
        width: 100%;
      }
      
      .btn > tbody > tr > td {
        padding-bottom: 16px;
      }
      
      .btn table {
        width: auto;
      }
      
      .btn table td {
        background-color: #ffffff;
        border-radius: 4px;
        text-align: center;
      }
      
      .btn a {
        background-color: #ffffff;
        border: solid 2px #0867ec;
        border-radius: 4px;
        box-sizing: border-box;
        color: #0867ec;
        cursor: pointer;
        display: inline-block;
        font-size: 16px;
        font-weight: bold;
        margin: 0;
        padding: 12px 24px;
        text-decoration: none;
        text-transform: capitalize;
      }
      
      .btn-primary table td {
        background-color: #0867ec;
      }
      
      .btn-primary a {
        background-color: #0867ec;
        border-color: #0867ec;
        color: #ffffff;
      }
      
      @media all {
        .btn-primary table td:hover {
          background-color: #ec0867 !important;
        }
        .btn-primary a:hover {
          background-color: #ec0867 !important;
          border-color: #ec0867 !important;
        }
      }
      
      /* -------------------------------------
      OTHER STYLES THAT MIGHT BE USEFUL
  ------------------------------------- */
      
      .last {
        margin-bottom: 0;
      }
      
      .first {
        margin-top: 0;
      }
      
      .align-center {
        text-align: center;
      }
      
      .align-right {
        text-align: right;
      }
      
      .align-left {
        text-align: left;
      }
      
      .text-link {
        color: #0867ec !important;
        text-decoration: underline !important;
      }
      
      .clear {
        clear: both;
      }
      
      .mt0 {
        margin-top: 0;
      }
      
      .mb0 {
        margin-bottom: 0;
      }
      
      .preheader {
        color: transparent;
        display: none;
        height: 0;
        max-height: 0;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        mso-hide: all;
        visibility: hidden;
        width: 0;
      }

      .compo-bloc {
          background: #f8fafb;
          border-radius: 5px;
          padding: 5px;
      }
      
      .title {
        padding: 1em;
        background: #e2e2e2;
        border-radius: 5px 5px 0 0;
        font-weight: bold;
    }

    ul, li {
      list-style-type: disclosure-closed;
  }
  .primary {
    margin-left: 1.5em;
    display: block;
    font-size: .8em;
    color: #69ac37;
}
      
      /* -------------------------------------
      RESPONSIVE AND MOBILE FRIENDLY STYLES
  ------------------------------------- */
      
      @media only screen and (max-width: 640px) {
        .main p,
        .main td,
        .main span {
          font-size: 16px !important;
        }
        .wrapper {
          padding: 8px !important;
        }
        .content {
          padding: 0 !important;
        }
        .container {
          padding: 0 !important;
          padding-top: 8px !important;
          width: 100% !important;
        }
        .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important;
        }
        .btn table {
          max-width: 100% !important;
          width: 100% !important;
        }
        .btn a {
          font-size: 16px !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      }
      /* -------------------------------------
      PRESERVE THESE STYLES IN THE HEAD
  ------------------------------------- */
      
      @media all {
        .ExternalClass {
          width: 100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
        .apple-link a {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important;
        }
        #MessageViewBody a {
          color: inherit;
          text-decoration: none;
          font-size: inherit;
          font-family: inherit;
          font-weight: inherit;
          line-height: inherit;
        }
      }
      </style>
    </head>
    <body>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
        <tr>
          <td>&nbsp;</td>
          <td class="container">
            <div class="content">
              <span class="preheader">Mon panier bio solidaire ${titre}</span>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
                <tr>
                  <td class="wrapper">
                  <h1>Mon panier ${titre}</h1>
                  <div class="compo-bloc">
                  ${contentHtml}
                  </div>
                  </td>
                </tr>
              </table>
              <div class="footer">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="content-block">
                      Panier bio solidaire
                    </td>
                    <td>&nbsp;</td>
                  </tr>
                </table>
              </div>
            </div>
          </td>
          <td>&nbsp;</td>
        </tr>
      </table>
    </body>
  </html>
      `;
}

function readAllFromStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise(resolve => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}