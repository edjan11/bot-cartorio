const venom = require('venom-bot');
const { CohereClientV2 } = require('cohere-ai');
const cohere = new CohereClientV2({
    token: 'ht9xs1kHX39prhZWV7MidfQn06l3UX2sGny0nvqz',
});

  const axios = require('axios')
  const qs = require('qs')
  
  const SEARCH_URL = 'https://www.tjse.jus.br/scc/paginas/nascimento/ConsultaNascimento.jsp';
  
  

  
  const sessionCookies = 'JSESSIONID=5D6BAE73D539A5094A22E7C97F681ECC.ntomsrv01'
  
  const axiosConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: sessionCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
  };
  
  async function realizarConsulta(nome, nomeMae) {
      try {

        const formData = {
            operacao: 'PESQUISAR', 
            paramAverbacao: 'N',
            paramNome: nome, 
            paramNomeMae: '', 
            paramNomePai: '', 
            paramTermo: '', 
            paramDataTermo: '', 
            paramDataNascimento: '', 
            paramDeclaracao: '', 
            paramIdCartorio: '', 
        }
          const data = qs.stringify(formData)

          const response = await axios.post(SEARCH_URL, data, axiosConfig)
          const cheerio = require('cheerio')
          const $ = cheerio.load(response.data)
          const registros = []; 
          console.log(response)

          $('table.tabela tr').each((index, element) => {
              const colunas = $(element).find('td')
  
              if(colunas.length > 0) {
                  registros.push({
                      termo: $(colunas[1]).text().trim(),
                      dataTermo: $(colunas[2]).text().trim(),
                      dataNascimento: $(colunas[3]).text().trim(),
                      nome: $(colunas[4]).text().trim(),
                      nomePais: $(colunas[5]).text().trim(),
                      dnv: $(colunas[6]).text().trim(),
                      cartorio: $(colunas[7]).text().trim(),
  
                  })
              }
          })
  
          return registros
      } catch(error) {
          console.log(error)
      }
  }
  


const CONTEXTO_CARTORIO = `
Responda sempre de forma clara, direta e informativa, sem enrolação ou excessos.
Se possível deixe a mensagem sempre o mais visivelmente receptiva, lembrando que trata-se do whatsapp; os parametros de visual que você pode usar
é por exemplo *Palavra* para negrito, etc...

  UTILIZE UMA LINGUAGEM MODERADAMENTE AMIGÁVEL E RESPEITOSA.
  Responda o necessário com clareza. Caso precise listar itens, seja objetivo.
  Solicite os dados necessários em formato direto e compreensível.

  COMO O CARTÓRIO 9º OFÍCIO PODE AJUDAR:
  Email: 9oficioaracaju@gmail.com
  Horário de funcionamento: Segunda a sexta das 08h às 14h (não fechamos para almoço).
  Endereço: Rua Laranjeiras, nº 47, Centro, Aracaju/SE, CEP 49010170.

  SOLICITAÇÃO DE 2ª VIA:
  Pode ser feita presencialmente ou pelo site: https://registrocivil.org.br/.
  Valor: R$68,35.
  Documentação necessária: RG ou certidão antiga.

  DOCUMENTAÇÃO NECESSÁRIA PARA GRATUIDADE:
  Folha de Resumo do CAD + Declaração de Hipossuficiência.
  Encaminhamento do CRAS.
  Encaminhamento da Defensoria Pública devidamente carimbado ou eletronicamente assinado.

  DOCUMENTAÇÃO NECESSÁRIA PARA UNIÃO ESTÁVEL:
  RG e CPF.
  Certidão de nascimento.
  Comprovante de residência.
  Valor: R$167,80.

  INFORMAÇÕES DE PROCURAÇÃO:
  Validação de procuração: R$69,92.
  Procuração amplos poderes: R$109,38.

  PERGUNTAS FREQUENTES SOBRE REGISTRO CIVIL:
  VERIFICAÇÃO DE REGISTRO:
  Fazemos essa verificação para o senhor. Basta enviar foto da certidão antiga ou do RG frente e verso.
  Caso não tenha ambos, informe: Nome completo, data de nascimento e nome completo da mãe para que possamos pesquisar no sistema.

  EMISSÃO DE SEGUNDA VIA:
  Pode sim, basta passar os dados que faremos o pedido para você.
  O pagamento é via PIX e varia de estado para estado. Após a confirmação, a certidão estará disponível para retirada em até 5 dias úteis.

  CORREÇÃO DE CERTIDÃO:
  Sim, corrigimos. Compareça ao cartório com a documentação necessária.
  Envie uma foto do erro na certidão e explique a situação para que possamos orientá-lo sobre os documentos.

  REGISTRO DO NOME DO PAI:
  (Deixe espaço para adicionar futuramente)

  REGISTRO PERDIDO:
  Basta apresentar seu RG para fazermos a busca.
  Caso tenha perdido também o RG, informe: Nome completo, nome completo da mãe, data de nascimento e o local onde foi registrado.

  GRATUIDADE DE CERTIDÕES:
  Sim, é possível emitir certidões gratuitamente. Apresente:
  Folha de Resumo do CAD + Declaração de Hipossuficiência.
  Encaminhamento do CRAS ou da Defensoria Pública, devidamente carimbado ou assinado eletronicamente.

  CONSULTAS DE ÓBITO OU CASAMENTO:
  Sim, realizamos consultas. Informe:
  Para óbito: Nome do falecido, nome do pai, nome da mãe ou data do óbito.
  Para casamento: Nomes completos dos cônjuges ou data do casamento.

  EMISSÃO URGENTE:
  Em casos comprovados de emergência, como saúde ou processos judiciais, é possível emitir com urgência mediante apresentação de documentação comprobatória.
  Para urgências genéricas (ex.: emitir RG), o prazo padrão é de 5 dias úteis.
`;

venom
  .create({
    session: 'cartorio-session',
    multidevice: true,
  })
  .then(client => startBot(client))
  .catch(err => console.error('Erro ao iniciar o bot:', err));

async function startBot(client) {
  client.onMessage(async message => {
    if (message.isGroupMsg) return; 

    const userMessage = message.body.trim();

    const resposta = await obterRespostaCohere(userMessage);
    console.log(resposta)

    if(resposta && resposta.toLowerCase().startsWith('buscar')) {
        const [_, nome, nomeMae] = resposta.split(';').map(s => s.trim())
        console.log(nome, nomeMae,'here')
        if(!nome || !nomeMae) {
            await client.sendText(message.from, "Envie os dados correto")
        }
        const registros = await realizarConsulta(nome, nomeMae)
        console.log(registros)
        if (registros[0].termo === '' ) {
            await client.sendText(message.from, "Nenhum registro encontrado com esse nome")
        } else {
            console.log(registros)
            const registrosOficioTrue = registros.filter(r => /(9º OFÍCIO|6º OFÍCIO|14º OFÍCIO|12º OFÍCIO|15º OFÍCIO)/.test(r.cartorio))
            console.log(registrosOficioTrue)
            if(registrosOficioTrue.length > 0) {
                await client.sendText(message.from, `Econtramos seu registros(s) deseja emitir a segunda via?`)
            } else {
                await client.sendText(message.from, `O Registro encontrado pertence a outro cartorio: ` + registros.map(r => `${r.nome} - ${r.catorio}`))
            }

        }
        return;
    }

    if (resposta) {
      await client.sendText(message.from, resposta);
    } else {
      await client.sendText(
        message.from,
        'Desculpe, não consegui entender sua pergunta. Tente novamente!'
      );
    }
  });
}

async function obterRespostaCohere(pergunta) {
  try {
    const response = await cohere.generate({
      model: 'command-xlarge-nightly', 
      prompt: `${CONTEXTO_CARTORIO}\nPergunta: ${pergunta}\nResposta:`,
      max_tokens: 300,
      temperature: 0.7, 
    });
    console.log(response)
    const respostaGerada = response.generations[0].text.trim();
    return respostaGerada;
  } catch (error) {
    console.error('Erro ao se comunicar com a Cohere:', error);
    return null;
  }
}
