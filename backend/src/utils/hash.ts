import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string) => {
  console.log('Hashing password...'); // Debug log
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password hash created'); // Debug log
  return hash;
};

export const comparePassword = async (password: string, hash: string) => {
  console.log('Comparing:', { password, hash }); // Debug log
  try {
    const result = await bcrypt.compare(password, hash);
    console.log('Bcrypt compare result:', result); // Debug log
    return result;
  } catch (error) {
    console.error('Bcrypt compare error:', error);
    return false;
  }
};