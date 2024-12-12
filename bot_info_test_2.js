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
Como o cartório 9⁰ Ofício pode ajudar:
- Email: 9oficioaracaju@gmail.com
- Horário de funcionamento: Segunda a sexta das 08h às 14:00h (não fechamos para almoço).
- Endereço: Rua Laranjeiras, nº 47, Centro, Aracaju/SE, CEP 49010170.

SOLICITAÇÃO DE 2ª VIA:
- Pode ser feita presencialmente ou pelo site: https://registrocivil.org.br/.
- Valor: R$68,35.
- Documentação necessária: RG ou certidão antiga.

DOCUMENTAÇÃO NECESSÁRIA PARA GRATUIDADE:
- Folha de Resumo do CAD;
- Declaração de hipossuficiência;
- Encaminhamento do CRAS;
- Carteira de trabalho.

DOCUMENTAÇÃO NECESSÁRIA PARA UNIÃO ESTÁVEL:
- RG e CPF;
- Certidão de nascimento;
- Comprovante de residência.
- Valor: R$167,80.

INFORMAÇÕES DE PROCURAÇÃO:
- Validação de procuração: R$69,92.
- Procuração amplos poderes: R$109,38.

Responda de forma breve e clara, em no máximo 4 frases.

  Caso for uma pergunta de registro, frona o formato, caso ele queira consultar se a segunda via, de casamento ou nascimento pertence ao cartorio peça os dados e dps diga: "buscar;Nome Completo;Nome da Mãe;
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
