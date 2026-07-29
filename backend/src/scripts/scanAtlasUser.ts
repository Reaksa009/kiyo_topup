import mongoose from 'mongoose';

const pass = 'hiTSRJYEDEPfAHKh';
const host = 'cluster0.wptnaow.mongodb.net';
const usernames = [
  'VReaksa',
  'vreaksa',
  'vreaksa_admin',
  'vreaksa2026',
  'kiyo',
  'kiyotopup',
  'kiyo_admin',
  'kiyo_topup',
  'topup',
  'admin',
  'root',
  'user',
  'dbUser',
  'dbuser',
  'test',
  'dev',
  'asus',
  'ASUS',
  'mongouser',
  'atlas'
];

async function scan() {
  for (const u of usernames) {
    const uri = `mongodb+srv://${u}:${pass}@${host}/kiyo_topup?retryWrites=true&w=majority`;
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('MATCH_FOUND:' + u + '|' + uri);
      process.exit(0);
    } catch (err: any) {
      console.log('FAILED:' + u);
    }
  }
}

scan();
