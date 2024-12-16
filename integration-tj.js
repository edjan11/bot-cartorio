const axios = require('axios')
const qs = require('qs')

const SEARCH_URL = 'https://www.tjse.jus.br/scc/paginas/nascimento/ConsultaNascimento.jsp';


const formData = {
    operacao: 'PESQUISAR', 
    paramAverbacao: 'N',
    paramNome: 'JOAO MATEUS', 
    paramNomeMae: '', 
    paramNomePai: '', 
    paramTermo: '', 
    paramDataTermo: '', 
    paramDataNascimento: '', 
    paramDeclaracao: '', 
    paramIdCartorio: '263', 
}

const sessionCookies = 'JSESSIONID=5D6BAE73D539A5094A22E7C97F681ECC.ntomsrv01'

const axiosConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: sessionCookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
};

async function realizarConsulta() {
    try {
        const data = qs.stringify(formData)
        const response = await axios.post(SEARCH_URL, data, axiosConfig)
        const cheerio = require('cheerio')
        const $ = cheerio.load(response.data)
        const registros = []; 

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

        console.log(registros)
    } catch(error) {
        console.log(error)
    }
}

realizarConsulta()