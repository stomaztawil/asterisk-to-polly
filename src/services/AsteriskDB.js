const mysql = require('mysql2/promise');
const fs = require('fs').promises;

class AsteriskDB {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.sqlStatements = [];
  }

  async initialize() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: this.config.database.schema
    });

    await this.createTablesIfNeeded();
  }

  async createTablesIfNeeded() {
    // Check and create tables if needed
  }

  async insertRecording({ filename, description, language }) {
    const sql = `INSERT INTO ${this.config.database.table} 
      (displayname, filename, description, fcode, fcode_pass) 
      VALUES (?, ?, ?, 0, ?)`;
    
    await this.connection.execute(sql, [
      filename, 
      filename, 
      description, 
      language
    ]);
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

module.exports = { AsteriskDB };