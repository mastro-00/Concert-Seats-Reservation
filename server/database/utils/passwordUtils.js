const crypto = require('crypto');

// Generate a salt
const generateSalt = (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
};

// Hash the password with the salt using PBKDF2
const hashPasswordWithKeyDerivation = (password, salt) => {
    const iterations = 100000; // Number of iterations
    const keyLength = 64; // Length of the resulting key
    const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256'); // Hash the password
    return hash.toString('hex'); // Return the hashed password
};

// Verify the password
const verifyPassword = (providedPassword, storedSalt, storedHash) => {
    const hash = hashPasswordWithKeyDerivation(providedPassword, storedSalt);
    return hash === storedHash;
};

// Export the functions so they can be used in other files
module.exports = {
    generateSalt,
    hashPasswordWithKeyDerivation,
    verifyPassword
};