# MaybePay

*Blockchain micropayments with no minimum size*

## How it Works

```
Client:
  request /resource

Server:
  will provide /resource for $0.01, hash(server-secret)=0xced8

Client:
  request /resource
  + payment (signed message - nothing on-chain yet):
    if (preimage(0xced8) + 0x2f4a < 0x0100) {
      pay (anyone) $2.56
    }

Server:
  respond /resource

Server:
  1/256 chance:
    Submit tx on chain, redeeming $2.56 compensation
  255/256 chance:
    No actual compensation, but satisfied by the chance of being
    paid, and honours the request to maintain reputation and
    expected compensation from continued interaction
```
