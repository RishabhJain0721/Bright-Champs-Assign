import bcrypt from "bcryptjs";

export const hashPassword = (pass) => {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(pass, saltRounds);
  return hash;
};
