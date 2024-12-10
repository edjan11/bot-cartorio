const venom = require('venom-bot');
const db = require('./database');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();

const menus = {
  menuPrincipal: `Olá! Bem-vindo(a) ao nosso atendimento virtual. Sou o assistente do Cartório. Escolha o assunto que deseja tratar:
1️⃣ Registro Civil
2️⃣ Notas`,
  registroCivil: `Entendido. Para Registro Civil, com qual dos serviços abaixo posso te ajudar?
1️⃣ Solicitação de 2ª via
2️⃣ Solicitação de correção de erro
3️⃣ Solicitação de certidão com averbação (ex.: divórcio, alteração de gênero)
4️⃣ Dúvida sobre registros (nascimento, casamento, óbito)
5️⃣ Outro assunto`,
  tipoCertidao: `Por favor, escolha a certidão para a qual deseja solicitar a 2ª via:
1️⃣ Nascimento
2️⃣ Casamento
3️⃣ Óbito`,
  segundaVia: `Você possui uma foto da certidão antiga ou do fundo do RG?
1️⃣ Sim
2️⃣ Não`,
  gerarBoleto: `Você tem certeza que deseja emitir o boleto vinculado à sua solicitação?
1️⃣ Sim
2️⃣ Não`,
  notas: `Entendido. Para Notas, com qual dos serviços abaixo posso te ajudar?
1️⃣ Reconhecimento de firma
2️⃣ Autenticação de documentos
3️⃣ Escritura pública
4️⃣ Procuração
5️⃣ Outro assunto`,
  aguardandoFoto: `Aguardando o envio da foto da certidão antiga ou do fundo do RG.`,
  coletaDadosCRC: `Seus dados estão sendo analisados.`,
};

venom
  .create({
    session: 'chat-bot-cart-session-2',
    multidevice: true,
    headless: true,
  })
  .then(client => startBot(client))
  .catch(err => console.error(err));

function startBot(client) {
  const userContext = new Map();
  const userData = new Map();
  const imageStorage = new Map();

  client.onMessage(async message => {
    if (message.isGroupMsg) return;

    const userResponse = message.body.trim();
    const userId = message.from;
    const operationId = '5579996326088@c.us'

    if (message.type === 'image') {
      const currentImages = imageStorage.get(userId) || [];
      const urlImage = "mock:image-url.com";
      currentImages.push(urlImage);
      imageStorage.set(userId, currentImages);

      if (currentImages.length === 1) {
        await client.sendText(userId, 'Imagem recebida! Deseja enviar outra imagem (ex.: verso do RG)? Responda "Sim" para enviar ou "Não" para continuar.');
        userContext.set(userId, 'aguardandoConfirmacaoFoto');
      } else {
        await client.sendText(userId, 'Recebemos todas as imagens necessárias. Prosseguindo para análise.');
        const user = userData.get(userId) || {};
        user.images = currentImages;
        userData.set(userId, user);
        userContext.set(userId, 'coletaDadosCRC');
        const finalData = userData.get(userId);
        if (finalData) {
          await saveRequest(client, userId, `Solicitação de ${finalData.typeOfCertidao}`, JSON.stringify(finalData));
          await client.sendText(userId, 'Dados analisados com sucesso. Prosseguindo para gerar boleto.');
          userContext.set(userId, 'gerarBoleto');
          await sendMenu(client, userId, 'gerarBoleto');
        }
      }
      return;
    }

    if (userContext.get(userId) === 'aguardandoConfirmacaoFoto') {
      if (userResponse.toLowerCase() === 'sim') {
        await client.sendText(userId, 'Por favor, envie a próxima imagem.');
        userContext.set(userId, 'aguardandoFoto');
      } else if (userResponse.toLowerCase() === 'não') {
        const user = userData.get(userId) || {};
        user.images = imageStorage.get(userId) || [];
        userData.set(userId, user);
        imageStorage.delete(userId);
        await client.sendText(userId, 'Prosseguindo com a análise.');
        userContext.set(userId, 'coletaDadosCRC');
        const finalData = userData.get(userId);
        if (finalData) {
          await saveRequest(client, userId, `Solicitação de ${finalData.typeOfCertidao}`, JSON.stringify(finalData));
          await client.sendText(userId, 'Dados analisados com sucesso. Prosseguindo para gerar boleto.');
          userContext.set(userId, 'gerarBoleto');
          await sendMenu(client, userId, 'gerarBoleto');
        }
      } else {
        await client.sendText(userId, 'Opção inválida! Responda "Sim" para enviar outra imagem ou "Não" para continuar.');
      }
      return;
    }

    const currentContext = userContext.get(userId) || 'menuPrincipal';
    switch (currentContext) {
      case 'menuPrincipal':
        if (userResponse === '1') {
          await sendMenu(client, userId, 'registroCivil');
          userContext.set(userId, 'registroCivil');
        } else if (userResponse === '2') {
          await sendMenu(client, userId, 'notas');
          userContext.set(userId, 'notas');
        } else {
          await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
          await sendMenu(client, userId, 'menuPrincipal');
        }
        break;

      case 'registroCivil':
        if (userResponse === '1') {
          await sendMenu(client, userId, 'tipoCertidao');
          userContext.set(userId, 'tipoCertidao');
        } else {
          await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
          await sendMenu(client, userId, 'registroCivil');
        }
        break;

      case 'tipoCertidao':
        if (['1', '2', '3'].includes(userResponse)) {
          const certidao = userResponse === '1' ? 'Nascimento' : userResponse === '2' ? 'Casamento' : 'Óbito';
          const user = userData.get(userId) || {};
          user.typeOfCertidao = certidao;
          userData.set(userId, user);

          await sendMenu(client, userId, 'segundaVia');
          userContext.set(userId, 'segundaVia');
        } else {
          await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
          await sendMenu(client, userId, 'tipoCertidao');
        }
        break;

      case 'segundaVia':
        if (userResponse === '1') {
          await client.sendText(userId, 'Envie a foto da certidão ou do RG (frente e verso).');
          userContext.set(userId, 'aguardandoFoto');
        } else if (userResponse === '2') {
          await client.sendText(userId, 'Informe o nome completo do registrado:');
          userContext.set(userId, 'coletaNome');
        } else {
          await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
          await sendMenu(client, userId, 'segundaVia');
        }
        break;

      case 'coletaNome':
        const userWithNome = userData.get(userId) || {};
        userWithNome.nomeCompleto = userResponse;
        userData.set(userId, userWithNome);

        await client.sendText(userId, 'Informe a data de nascimento do registrado (DD/MM/AAAA):');
        userContext.set(userId, 'coletaDataNascimento');
        break;

      case 'coletaDataNascimento':
        const userWithNascimento = userData.get(userId) || {};
        userWithNascimento.dataNascimento = userResponse;
        userData.set(userId, userWithNascimento);

        await client.sendText(userId, 'Informe o nome completo dos pais:');
        userContext.set(userId, 'coletaNomePais');
        break;

      case 'coletaNomePais':
        const userWithPais = userData.get(userId) || {};
        userWithPais.nomeDosPais = userResponse;
        userData.set(userId, userWithPais);

        await client.sendText(userId, 'Analisando dados...');
        userContext.set(userId, 'coletaDadosCRC');
        const finalData = userData.get(userId);
        if (finalData) {
          await saveRequest(client, userId, `Solicitação de ${finalData.typeOfCertidao}`, JSON.stringify(finalData));
          await client.sendText(userId, 'Seus dados estão sendo analisados.');

          // userContext.set(userId, 'gerarBoleto');
          // await sendMenu(client, userId, 'gerarBoleto');
        }
        break;

      // case 'gerarBoleto':
      //   if (userResponse === '1') {
      //     await client.sendText(userId, 'Boleto gerado com sucesso! Obrigado.');
      //     userContext.set(userId, 'menuPrincipal');
      //   } else if (userResponse === '2') {
      //     await client.sendText(userId, 'Solicitação cancelada.');
      //     userContext.set(userId, 'menuPrincipal');
      //   } else {
      //     await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
      //     await sendMenu(client, userId, 'gerarBoleto');
      //   }
      //   break;

      default:
        await client.sendText(userId, menus.menuPrincipal);
        userContext.set(userId, 'menuPrincipal');
    }
  });
}

function isCommand(text) {
  const commands = ['1', '2', '3', '4', '5'];
  return commands.includes(text.toLowerCase());
}

async function sendMenu(client, to, menu) {
  const dinamicMenus = ['aguardandoFoto', 'coletaDadosCRC', 'coletaNome', 'coletaDataNascimento', 'coletaNomePais'];
  
  if (dinamicMenus.includes(menu)) {
    console.log(`Menu dinâmico detectado: ${menu}, não enviando texto estático.`);
    return;
  }

  if (menus[menu]) {
    console.log(`Enviando menu estático: ${menu}`);
    await client.sendText(to, menus[menu]);
  } else {
    console.error(`Menu "${menu}" não encontrado.`);
  }
}

async function saveRequest(client, user, tipo, detalhes) {
  await client.sendText(user, 'Registrando sua solicitação... Por favor, aguarde.');
  db.run(
    `INSERT INTO solicitacoes (usuario, tipo_solicitacao, detalhes) VALUES (?, ?, ?)`,
    [user, tipo, detalhes],
    err => {
      if (err) {
        console.error('Erro ao salvar solicitação:', err);
        client.sendText(user, 'Erro ao registrar sua solicitação.');
      } else {
        const protocolo = Math.floor(100000 + Math.random() * 900000);
        client.sendText(user, `Sua solicitação foi registrada! Protocolo: ${protocolo}`);
      }
    }
  );
}
