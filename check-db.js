const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_express');
    const db = mongoose.connection.db;
    
    console.log('📚 ALL Collections in database:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('  (No collections)');
    } else {
      collections.forEach(c => {
        console.log('  -', c.name);
      });
      
      // Now check each collection for data
      console.log('\n📊 Collection sizes:');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} documents`);
        if (count > 0) {
          const sample = await db.collection(col.name).findOne({});
          console.log(`    Sample:`, JSON.stringify(sample).substring(0, 100) + '...');
        }
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkDB();
