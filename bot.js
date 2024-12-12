const venom = require('venom-bot');
const db = require('./database');
const menus = require('./menus');

// Enums para Contextos
const Context = {
  MENU_PRINCIPAL: 'menuPrincipal',
  REGISTRO_CIVIL: 'registroCivil',
  NOTAS: 'notas',
  TIPO_CERTIDAO: 'tipoCertidao',
  SEGUNDA_VIA: 'segundaVia',
  COLETA_NOME: 'coletaNome',
  COLETA_DATA_NASCIMENTO: 'coletaDataNascimento',
  COLETA_NOME_PAIS: 'coletaNomePais',
  GERAR_BOLETO: 'gerarBoleto',
  AGUARDANDO_FOTO: 'aguardandoFoto',
  AGUARDANDO_CONFIRMACAO_FOTO: 'aguardandoConfirmacaoFoto',
  COLETA_DADOS: 'coletaDadosCRC',
  RESUMO_SOLICITACAO: 'resumoSolicitacao',

};
const ALLOWED_NUMBER = '557998786100@c.us'
venom
  .create({
    session: 'chat-bot-cart-session-2',
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
    if (message.from !== ALLOWED_NUMBER) {
      console.log(`Mensagem recebida de um número não autorizado: ${message.from}`);
      return; 
    }
    const userId = message.from;
    const userResponse = message.body.trim();

    if (!userContext.has(userId)) {
      console.log("here")
      userContext.set(userId, Context.MENU_PRINCIPAL);
      const buttons = [
        {
          "buttonText": {
            "displayText": "Text of Button 1"
            }
          },
        {
          "buttonText": {
            "displayText": "Text of Button 2"
            }
          }
        ]
        await await client
        .sendButtons(
          '557998786100@c.us', // Número do destinatário
          'Escolha uma das opções abaixo:', // Título
          [
            { buttonId: 'registroCivil', buttonText: { displayText: 'Registro Civil' }, type: 1 },
            { buttonId: 'notas', buttonText: { displayText: 'Notas' }, type: 1 },
          ],
          'Menu Principal' // Subtítulo ou descrição
        )
        .then((result) => {
          console.log('Botões enviados com sucesso:', result);
        })
        .catch((error) => {
          console.error('Erro ao enviar botões:', error);
        });

      return; 
    }

    if (message.type === 'image') {
        await handleImageMessage(client, userId, userContext, imageStorage, userData);
        return;
      }
      const currentContext = userContext.get(userId) || Context.MENU_PRINCIPAL;
      await handleUserResponse(client, userId, userResponse, currentContext, userContext, userData, imageStorage);
  });
}

async function handleImageMessage(client, userId, userContext, imageStorage, userData) {
  const currentImages = imageStorage.get(userId) || [];
  const urlImage = "mock:image-url.com"; // Mock de URL de imagem
  currentImages.push(urlImage);
  imageStorage.set(userId, currentImages);

  if (currentImages.length === 1) {
    await client.sendText(userId, 'Imagem recebida! Deseja enviar outra imagem (ex.: verso do RG)? Responda "Sim" para enviar ou "Não" para continuar.');
    userContext.set(userId, Context.AGUARDANDO_CONFIRMACAO_FOTO);
  } else {
    await finalizeImageProcessing(client, userId, imageStorage, userData);
    userContext.set(userId, Context.COLETA_DADOS);
  }
}

async function handleUserResponse(client, userId, userResponse, currentContext, userContext, userData, imageStorage) {
  switch (currentContext) {
    case Context.MENU_PRINCIPAL:
      await handleMenuPrincipal(client, userId, userResponse, userContext);
      break;

    case Context.REGISTRO_CIVIL:
      await handleRegistroCivil(client, userId, userResponse, userContext);
      break;

    case Context.TIPO_CERTIDAO:
      await handleTipoCertidao(client, userId, userResponse, userContext, userData);
      break;

    case Context.SEGUNDA_VIA:
      await handleSegundaVia(client, userId, userResponse, userContext);
      break;

    case Context.COLETA_NOME:
      await handleColetaNome(client, userId, userResponse, userContext, userData);
      break;

    case Context.COLETA_DATA_NASCIMENTO:
      await handleColetaDataNascimento(client, userId, userResponse, userContext, userData);
      break;

    case Context.COLETA_NOME_PAIS:
      await handleColetaNomePais(client, userId, userResponse, userContext, userData);
      break;

    case Context.GERAR_BOLETO:
      await handleGerarBoleto(client, userId, userResponse, userContext);
      break;

    case Context.AGUARDANDO_CONFIRMACAO_FOTO:
      await handleConfirmacaoFoto(client, userId, userResponse, userContext, imageStorage, userData);
      break;

    case Context.RESUMO_SOLICITACAO:
      await handleResumoSolicitacao(client, userId, userResponse, userContext, userData);
      break;

    default:
      await client.sendText(userId, menus.menuPrincipal);
      userContext.set(userId, Context.MENU_PRINCIPAL);
  }
}

async function handleConfirmacaoFoto(client, userId, userResponse, userContext, imageStorage, userData) {
  if (userResponse.toLowerCase() === 'sim') {
    await client.sendText(userId, 'Por favor, envie a próxima imagem.');
    userContext.set(userId, Context.AGUARDANDO_FOTO);
  } else if (userResponse.toLowerCase() === 'não') {
    await finalizeImageProcessing(client, userId, imageStorage, userData);
    userContext.set(userId, Context.COLETA_DADOS);
  } else {
    await client.sendText(userId, 'Resposta inválida! Responda "Sim" para enviar outra imagem ou "Não" para continuar.');
  }
}


async function handleMenuPrincipal(client, userId, userResponse, userContext) {
  if (!userResponse) {
    await client.sendButtons(userId, 'Escolha uma das opções abaixo:', [
      { body: 'Registro Civil' },
      { body: 'Notas' },
    ], 'Menu Principal');
    return;
  }
  if (userResponse === 'Registro Civil') {
    await sendMenu(client, userId, Context.REGISTRO_CIVIL);
    userContext.set(userId, Context.REGISTRO_CIVIL);
  } else if (userResponse === 'Notas') {
    await sendMenu(client, userId, Context.NOTAS);
    userContext.set(userId, Context.NOTAS);
  } else {
    await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
    await handleMenuPrincipal(client, userId, null, userContext); 
  }
}

async function handleRegistroCivil(client, userId, userResponse, userContext) {
  if (!userResponse) {
    await client.sendButtons(userId, 'Escolha o tipo de serviço:', [
      { body: 'Solicitação de 2ª via' },
      { body: 'Correção de erro' },
      { body: 'Certidão com averbação' },
    ], 'Registro Civil');
    return;
  }
  if (userResponse === 'Solicitação de 2ª via') {
    await sendMenu(client, userId, Context.TIPO_CERTIDAO);
    userContext.set(userId, Context.TIPO_CERTIDAO);
  } else {
    await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
    await handleRegistroCivil(client, userId, null, userContext); 
  }
}

async function handleTipoCertidao(client, userId, userResponse, userContext, userData) {
  if (!userResponse) {
    await client.sendButtons(userId, 'Escolha o tipo de certidão:', [
      { body: 'Nascimento' },
      { body: 'Casamento' },
      { body: 'Óbito' },
    ], 'Tipo de Certidão');
    return;
  }
  const certidao = { 'Nascimento': 'Nascimento', 'Casamento': 'Casamento', 'Óbito': 'Óbito' }[userResponse];
  if (certidao) {
    const user = userData.get(userId) || {};
    user.typeOfCertidao = certidao;
    userData.set(userId, user);
    await sendMenu(client, userId, Context.SEGUNDA_VIA);
    userContext.set(userId, Context.SEGUNDA_VIA);
  } else {
    await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
    await handleTipoCertidao(client, userId, null, userContext, userData);
  }
}

async function handleSegundaVia(client, userId, userResponse, userContext) {
  if (!userResponse) {
    await client.sendButtons(userId, 'Você possui uma foto da certidão antiga ou RG?', [
      { body: 'Sim' },
      { body: 'Não' },
    ], 'Segunda Via');
    return;
  }
  if (userResponse === 'Sim') {
    await client.sendText(userId, 'Envie a foto da certidão ou do RG (frente e verso).');
    userContext.set(userId, Context.AGUARDANDO_FOTO);
  } else if (userResponse === 'Não') {
    await client.sendText(userId, 'Informe o nome completo do registrado:');
    userContext.set(userId, Context.COLETA_NOME);
  } else {
    await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
    await handleSegundaVia(client, userId, null, userContext); 
  }
}

async function handleColetaNome(client, userId, userResponse, userContext, userData) {
  const user = userData.get(userId) || {};
  user.nomeCompleto = userResponse;
  userData.set(userId, user);
  await client.sendButtons(userId, 'Informe a data de nascimento do registrado:', [
    { body: 'DD/MM/AAAA' },
  ], 'Data de Nascimento');  
  userContext.set(userId, Context.COLETA_DATA_NASCIMENTO);
}

async function handleColetaDataNascimento(client, userId, userResponse, userContext, userData) {
  const user = userData.get(userId) || {};
  user.dataNascimento = userResponse;
  userData.set(userId, user);
  await client.sendButtons(userId, 'Informe o nome completo dos pais:', [
    { body: 'Nome dos Pais' },
  ], 'Nome dos Pais');
  userContext.set(userId, Context.COLETA_NOME_PAIS);
}

async function handleColetaNomePais(client, userId, userResponse, userContext, userData) {
  const user = userData.get(userId) || {};
  user.nomeDosPais = userResponse;
  userData.set(userId, user);
  const resumo = `
  Confirme os dados da sua solicitação:
  - Nome Completo: ${user.nomeCompleto}
  - Data de Nascimento: ${user.dataNascimento}
  - Nome dos Pais: ${user.nomeDosPais}
  - Tipo de Certidão: ${user.typeOfCertidao}
  `;
  await client.sendButtons(userId, resumo, [
    { body: 'Sim' },
    { body: 'Não' },
  ], 'Os dados estão corretos?');

  userContext.set(userId, Context.RESUMO_SOLICITACAO); 
}

async function handleGerarBoleto(client, userId, userResponse, userContext) {
  if (userResponse === '1') {
    await client.sendText(userId, 'Boleto gerado com sucesso! Obrigado.');
    userContext.set(userId, Context.MENU_PRINCIPAL);
  } else if (userResponse === '2') {
    await client.sendText(userId, 'Solicitação cancelada.');
    userContext.set(userId, Context.MENU_PRINCIPAL);
  } else {
    await client.sendText(userId, 'Opção inválida. Escolha uma opção válida:');
    await sendMenu(client, userId, Context.GERAR_BOLETO);
  }
}

async function handleResumoSolicitacao(client, userId, userResponse, userContext, userData) {
  if (userResponse.toLowerCase() === 'sim') {
    const user = userData.get(userId);
    await saveRequest(client, userId, `Solicitação de ${user.typeOfCertidao}`, JSON.stringify(user));
    await client.sendText(userId, 'Dados confirmados e análise iniciada. Prosseguindo para gerar boleto.');
    userContext.set(userId, Context.GERAR_BOLETO);
    await sendMenu(client, userId, Context.GERAR_BOLETO);
  } else if (userResponse.toLowerCase() === 'não') {
    await client.sendText(userId, 'Por favor, informe novamente o nome completo do registrado:');
    userContext.set(userId, Context.COLETA_NOME);
  } else {
    await client.sendText(userId, 'Resposta inválida. Por favor, responda "Sim" para confirmar ou "Não" para corrigir.');
  }
}


async function finalizeImageProcessing(client, userId, imageStorage, userData) {
  const userImages = imageStorage.get(userId) || [];
  const user = userData.get(userId) || {};
  user.images = userImages;
  userData.set(userId, user);
  imageStorage.delete(userId);
  await client.sendText(userId, 'Recebemos todas as imagens necessárias. Prosseguindo para análise.');
}

async function sendMenu(client, userId, menuKey) {
  const menuText = menus[menuKey];
  if (menuText) {
    await client.sendText(userId, menuText);
  } else {
    console.error(`Menu "${menuKey}" não encontrado.`);
  }
}

async function saveRequest(client, userId, tipo, detalhes) {
  await client.sendText(userId, 'Registrando sua solicitação... Por favor, aguarde.');
  db.run(
    `INSERT INTO solicitacoes (usuario, tipo_solicitacao, detalhes) VALUES (?, ?, ?)`,
    [userId, tipo, detalhes],
    err => {
      if (err) {
        console.error('Erro ao salvar solicitação:', err);
        client.sendText(userId, 'Erro ao registrar sua solicitação.');
      } else {
        const protocolo = Math.floor(100000 + Math.random() * 900000);
        client.sendText(userId, `Sua solicitação foi registrada! Protocolo: ${protocolo}`);
      }
    }
  );
}


