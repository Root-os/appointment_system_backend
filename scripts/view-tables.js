const sequelize = require('../config/db');

async function viewTables() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Show all tables
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('\n📋 Available Tables:');
    results.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    // Show table structures
    console.log('\n🏗️  Table Structures:');
    for (const row of results) {
      const tableName = Object.values(row)[0];
      console.log(`\n--- ${tableName.toUpperCase()} ---`);
      const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await sequelize.close();
  }
}

viewTables();
