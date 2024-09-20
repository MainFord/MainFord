export const generateReferralCode = () => {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MF-${randomString}`;
  };
  