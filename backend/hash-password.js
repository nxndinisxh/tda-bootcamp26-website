import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash-password.js <plain_text_password>');
  process.exit(1);
}

const generateHash = async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`\nPlain Text: ${password}`);
  console.log(`Bcrypt Hash: ${hash}\n`);
};

generateHash();
