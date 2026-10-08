const fs = require("fs");
const path = require("path");
const solc = require("solc");

const contractPath = path.join(
  __dirname,
  "../contracts/TransplantChain.sol"
);

const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "TransplantChain.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach((error) => {
    console.log(error.formattedMessage);
  });

  const hasError = output.errors.some(
    (error) => error.severity === "error"
  );

  if (hasError) {
    process.exit(1);
  }
}

const contract =
  output.contracts["TransplantChain.sol"]["TransplantChain"];

const buildPath = path.join(
  __dirname,
  "../build/TransplantChain.json"
);

fs.writeFileSync(
  buildPath,
  JSON.stringify(
    {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    },
    null,
    2
  )
);

console.log("Smart contract compiled successfully!");