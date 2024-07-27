import dns from "dns";

export const isEmailValid = async (email) => {
  const emailParts = email.split("@");
  const domain = emailParts[1];
  const addresses = await dns.promises.resolveMx(domain);
  if (addresses && addresses.length !== 0) return true;
  else return false;
};
