// generateHash.js

const bcrypt = require('bcrypt');

const password = 'yourSecureAdminPassword'; // Replace with your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed Password:', hash);
});
