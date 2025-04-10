const mysql = require('mysql2/promise');
const fs = require('fs').promises;

class AsteriskDB {
    constructor(config) {
        this.config = config.database;
        this.connection = null;
    }

    async initialize() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'asterisk',
                password: process.env.DB_PASSWORD,
                database: this.config.schema
            });
            
            await this.createTablesIfNeeded();
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async createTablesIfNeeded() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS ${this.config.table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                displayname VARCHAR(255) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                description TEXT,
                fcode INT DEFAULT 0,
                fcode_pass VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        try {
            for (const tableSql of tables) {
                await this.connection.execute(tableSql);
            }
        } catch (error) {
            console.error('Table creation failed:', error);
            throw error;
        }
    }

    async insertRecording({ filename, description, language = 'en' }) {
        try {
            const sql = `INSERT INTO ${this.config.table} 
                (displayname, filename, description, fcode_pass) 
                VALUES (?, ?, ?, ?)`;
            
            await this.connection.execute(sql, [
                filename, 
                filename, 
                description, 
                language
            ]);
            
            return true;
        } catch (error) {
            console.error('Insert failed:', error);
            throw error;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = { AsteriskDB };