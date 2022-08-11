# MaybePay

*Blockchain micropayments with no minimum size*

## Run the Frontend

MaybePay is just on the polygon testnet for now and has hardcoded values
allowing you to run the frontend without any additional setup.

1. Follow the instructions at [/frontend/README.md](./frontend/README.md)

## Deploying the Contracts

1. Compile the smart contracts: `yarn hardhat compile`
2. Deploy the smart contracts to Polygon: `yarn hardhat run scripts/deploy.ts --network mumbai`

## How it Works

```
Client:
  request /resource

Server:
  will provide /resource for $0.0010, hash(server-secret)=0xced8e9

Client:
  request /resource
  + payment (signed message - nothing on-chain yet):
    if (preimage(0xced8e9) + 0x2f4ac2 < 0x000d1b) {
      pay server $5.00
    }

Server:
  respond /resource

Server:
  1/5000 chance:
    Submit tx on chain, redeeming $5.00 compensation
  4999/5000 chance:
    No actual compensation, but satisfied by the chance of being
    paid, and honours the request to maintain reputation and
    expected compensation from continued interaction
```
