# TransplantChain

## Privacy-Preserving IoT–Cloud–Local Ethereum Blockchain Framework for Auditable Organ Provenance, Allocation, and Chain of Custody

TransplantChain is a synthetic-data educational prototype demonstrating how IoT, AWS cloud services, local Ethereum blockchain technology, and SHA-256 cryptographic hashing can work together to provide auditable organ provenance and chain-of-custody tracking.

## Important Disclaimer

This project:

- Uses synthetic data only.
- Does not use real donor information.
- Does not use real patient information.
- Does not connect to hospital systems.
- Does not make medical decisions.
- Does not calculate compatibility.
- Does not recommend organ allocation.
- Does not guarantee organ viability.

The system records, tracks, hashes, verifies, and audits authorized synthetic events.

## Architecture

### Cloud Layer

- Amazon DynamoDB
- AWS Lambda
- Amazon API Gateway
- Amazon S3 (optional)

### Blockchain Layer

- Hardhat
- Local Ethereum Network
- Solidity
- ethers.js

### Application Layer

- React
- Vite

### IoT Layer

- Node.js IoT Simulator

## Core Demonstration

1. Register a synthetic organ.
2. Record allocation history.
3. Track custody transfers.
4. Record transportation events.
5. Capture synthetic IoT readings.
6. Generate SHA-256 hash proofs.
7. Store audit proofs on a local Ethereum blockchain.
8. Verify off-chain record integrity.
9. Demonstrate tampering detection.

## Project Status

Currently in development.

**Phase 1: Project Setup**

## Local configuration

The browser application does not use or expose a cloud API key. Its server uses AWS IAM credentials for the optional S3 audit archive, and blockchain settings for the local demonstration chain.

1. In the AWS Console, open **IAM** and create a dedicated user for local development. Do not create access keys for the AWS root user.
2. Attach only the permissions needed for the chosen S3 bucket: `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket`. The startup connection check also calls `ListBuckets`; either allow `s3:ListAllMyBuckets` for this development-only check or remove that check before using least-privilege production policies.
3. In the user’s **Security credentials** tab, create an **Access key** and choose the **Command Line Interface (CLI)** or local-code use case. Copy the access-key ID and secret immediately; AWS will not show the secret again.
4. Copy [`backend/.env.example`](/Users/harshini/Downloads/transplant%20chain/backend/.env.example) to `backend/.env`, then set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET`.
5. Set `BLOCKCHAIN_RPC_URL`, `CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY` to the local chain and contract deployed for the demo. Never use a production wallet private key.
6. Optionally copy [`frontend/.env.example`](/Users/harshini/Downloads/transplant%20chain/frontend/.env.example) to `frontend/.env` if the API is not running at `http://localhost:5000`.

Keep `.env` files private and out of source control. If an access key is shared or committed, deactivate it in IAM and issue a replacement.
