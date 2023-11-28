import { Contract, ContractEventName } from "ethers";

export const waitEvent = (
  contract: Contract,
  event: ContractEventName,
  cb: (...args: any[]) => void,
) => {
  return new Promise<void>((resolve, reject) => {
    try {
      contract.once(event, cb);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
