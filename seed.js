// import mongoose from 'mongoose';
// import User from './models/User.js'; // Adjust the path according to your project structure

// const sampleUser = {
//   name: 'John Doe',
//   email: 'john.doe@example.com',
//   phone: '+1234567890',
//   dob: new Date('1990-01-01'),
//   accountDetails: {
//     accountNumber: '',
//     ifsc: '',
//     holderName: '',
//   },
//   photoUrl: 'https://example.com/photo.jpg',
//   referralCode: 'REF12345',
//   paymentUrlOfReg: 'https://payment.example.com/register',
// };

// const run = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect('', { useNewUrlParser: true, useUnifiedTopology: true });
    
//     // Check if the user already exists
//     const existingUser = await User.findOne({ email: sampleUser.email });
//     if (!existingUser) {
//       // Create a new user
//       const user = new User(sampleUser);
//       await user.save();
//       console.log('Sample user added:', user);
//     } else {
//       console.log('User already exists:', existingUser);
//     }
    
//   } catch (error) {
//     console.error('Error adding sample user:', error);
//   } finally {
//     // Close the connection
//     await mongoose.connection.close();
//   }
// };

// run();
