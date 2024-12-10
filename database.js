const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('cartorio_bot.db', err => {
  if (err) console.error('Erro ao conectar ao banco de dados:', err);
  else console.log('Conectado ao banco de dados SQLite.');
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT,
      tipo_solicitacao TEXT,
      detalhes TEXT,
      status TEXT DEFAULT 'Pendente',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
});

module.exports = db;
