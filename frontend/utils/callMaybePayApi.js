import { ethers, BigNumber } from 'ethers'
import * as msgpackr from 'msgpackr'
import base64url from 'base64url'

import * as MaybePayLib from './MaybePayLib'

// About $5
const amountIfTriggered = ethers.utils.parseEther('0.003')

const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');

const wallet = new ethers.Wallet(
  // CAUTION: This is a private key. It's ok because it's just a testnet wallet.
  // Publishing a private key with real funds attached will cause the funds inside
  // to be drained by hackers.
  '203dfb3d0be339976af754905c0507029d92afc5eb19751c9f6e4bfa6a8dcefd',
  provider,
);

const ethUsd = 1853;

export default async function callMaybePayApi(url, limit) {
  const response = await fetch(url).then(res => res.json())

  if (response.type !== 'maybe-payment-request-message') {
    return response;
  }

  if (BigNumber.from(response.effectiveAmount).gt(limit)) {
    throw new Error('Not implemented: api requested payment that exceeds limit')
  }

  console.log(`Paying $${(ethers.utils.formatEther(response.effectiveAmount) * ethUsd).toFixed(4)} for ${url}`)
  const payment = await MaybePayLib.pay(response, amountIfTriggered, wallet)

  return await fetch(url, {
    headers: {
      'x-maybe-payment': base64url.encode(msgpackr.encode(payment))
    },
  }).then(res => res.json())
}
