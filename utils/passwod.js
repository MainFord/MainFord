export const generateMemorablePassword = (name, numDigits = 4) => {
    // Take the first 4 characters of the name, capitalize the first letter
    const formattedName = name.slice(0, 4).charAt(0).toUpperCase() + name.slice(1, 4).toLowerCase();
  
    // Characters for random digits
    const numbers = '0123456789';
  
    // Generate random digits
    let randomDigits = '';
    for (let i = 0; i < numDigits; i++) {
      randomDigits += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
  
    // Combine the sliced name with random digits
    const password = `${formattedName}@${randomDigits}`;
  
    return password;
  };

  