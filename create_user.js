const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const uri = 'mongodb+srv://injaazhos:9D9OqqbKwk0P7IQ1@injaazh-os.kerqqku.mongodb.net/injaazh_os?retryWrites=true&w=majority&appName=Injaazh-OS';
mongoose.connect(uri).then(async () => {
  const users = mongoose.connection.collection('users');
  const hashedPassword = await bcrypt.hash('password123', 10);
  await users.updateOne(
    { email: 'admin@tester.com' },
    { $set: { 
        name: 'Admin Tester', 
        email: 'admin@tester.com', 
        password: hashedPassword, 
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date()
      } 
    },
    { upsert: true }
  );
  console.log('Test user created/updated successfully');
  process.exit(0);
}).catch(console.error);
