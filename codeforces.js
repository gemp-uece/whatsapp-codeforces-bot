const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inicializa cliente WhatsApp com persistência local da sessão
const client = new Client({
  authStrategy: new LocalAuth(), // salva sessão para não precisar escanear QR toda vez
  puppeteer: { headless: true } // roda em background sem abrir navegador visível
});

// Gera e exibe QR code no terminal para autenticação inicial
client.on('qr', (qr) => {
  console.log('QR RECEIVED, escaneie com o WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// Log quando o cliente estiver pronto para uso
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto!');
});

class CodeForces {
  constructor(){
    this.url = 'https://codeforces.com/api/';
    this.gempHandles = ['buzzin','Calima','rhavyyz','layza_carneiro', 'ValenteBy', 'jm_mrqs', 'Felipe_Sena','iandomingos']
  }

  // For each handle, get the last 7 days problems accepted
  // and return the top 5 that has the most accepted problems

  async getTop5(){
    const handles = this.gempHandles;
    // ordered struct that will be used to store the rank in {handle, count} 
    const rank = [];

    for(let i = 0; i < handles.length;i+=1){
      const handle = handles[i];
      // https://codeforces.com/api/user.status?handle=buzzin&from=1&count=100
      const urlHandleRequest = `${this.url}user.status?handle=${handle}&from=1&count=100`;
      const response = await axios.get(urlHandleRequest);
      const data = response.data.result;
      const problems = data.filter((problem) => {
        const date = new Date(problem.creationTimeSeconds * 1000);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return problem.verdict === 'OK' && diffDays <= 7;
      }).map((problem) => {
        return {
          handle: problem.author.members[0].handle,
          problem: problem.problem.name,
        };
      })

      // Count the number of problems accepted by each handle in the unique list
      const uniqueProblems = [...new Set(problems.map((problem) => problem.problem))];
      const count = uniqueProblems.length;
      rank.push({ handle, count });
    }

    // Sort the rank by count
    rank.sort((a, b) => b.count - a.count);
    // Get the top 5 handles
    const top5 = rank.slice(0, 5);
    return top5;
  }
}

// Evento disparado ao receber mensagem
client.on('message', async (msg) => {
  try {
    // Verifica se a mensagem começa com "!gpt-calculo-3 "
    const prefix = '!codeforces rank-semanal';
    console.log('Mensagem recebida:', msg);
    // verfica se a mensagem recebida é enviada por apenas uma pessoa específica
    if (msg.body.startsWith(prefix)&& (msg.author === '558589468402@c.us' || msg.from === '558589468402@c.us')) {
      // Extrai o texto após o prefixo
      const textoUsuario = msg.body.slice(prefix.length).trim();
      // Envia a mensagem original de volta para o usuário (eco)
      const codeforces = new CodeForces();
      const top5 = await codeforces.getTop5();
      let resposta = 'Top 5 do Ranking semanal de problemas aceitos no Codeforces:\n\n';
      top5.forEach((item, index) => {
        // quero colocar icone de medalha
        // medalha de ouro, prata e bronze
        if(item.count !== 0){
          if(index === 0){
            resposta += `🥇 ${item.handle}: ${item.count} problemas aceitos\n`;
          }else if(index === 1){
            resposta += `🥈 ${item.handle}: ${item.count} problemas aceitos\n`;
          } else if(index === 2){
            resposta += `🥉 ${item.handle}: ${item.count} problemas aceitos\n`;
          } else {
            resposta += `${item.handle}: ${item.count} problemas aceitos\n`;
          }
        }
      });

      await msg.reply(`Segue o ranking semanal de problemas aceitos:\n\n${resposta}\n\n` + 'Parabéns a todos os participantes! Vamos continuar treinando e melhorando juntos! 💪\n\n');
    }
  } catch (err) {
    console.error('Erro no processamento da mensagem:', err);
  }
});

// Inicializa o cliente WhatsApp
client.initialize();