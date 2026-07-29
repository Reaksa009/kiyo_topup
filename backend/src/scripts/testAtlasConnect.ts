import mongoose from 'mongoose';

const pass = 'hiTSRJYEDEPfAHKh';
const host = 'cluster0.wptnaow.mongodb.net';
const usernames = ['admin', 'vreaksa', 'root', 'kiyo', 'user', 'kiyo_admin', 'db_username'];

async function testAtlas() {
  for (const u of usernames) {
    const uri = `mongodb+srv://${u}:${pass}@${host}/kiyo_topup?retryWrites=true&w=majority`;
    console.log(`Testing MongoDB Atlas connection with username: "${u}"...`);
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('====================================================');
      console.log('SUCCESSFULLY CONNECTED TO YOUR MONGODB ATLAS CLUSTER!');
      console.log('Valid Username:', u);
      console.log('Valid URI:', uri);
      console.log('====================================================');
      process.exit(0);
    } catch (err: any) {
      console.log(`User "${u}" failed:`, err.message);
    }
  }
}

testAtlas();
