const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('store.db');
console.log(db.prepare('SELECT id, name, image, price FROM products').all());
