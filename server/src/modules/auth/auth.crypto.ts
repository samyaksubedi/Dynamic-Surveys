import bcrypt from "bcrypt";

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const comparePassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);
