// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import * as msgpackr from 'msgpackr'
import base64url from 'base64url'
import { ethers } from 'ethers'

import * as MaybePayLib from '../../utils/MaybePayLib'

const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
const chainIdPromise = provider.getNetwork().then(n => n.chainId)

const serverWallet = new ethers.Wallet(
  'ddd30953966d95d22e720c0ac4cc56ad4b3f4aeb22a88f4bc484b7ce7ac3af13',
  provider,
)

const maybePay = MaybePayLib.connect("0x78E0B95781634F6E993B088019FB761ed7Dc4593", serverWallet)

// About 0.1¢
const priceWei = ethers.utils.parseEther('0.0000005')

const requestsByHash = {}

export default async function handler(req, res) {
  if (!req.headers['x-maybe-payment']) {
    const paymentRequest = MaybePayLib.request(priceWei, serverWallet.address, await chainIdPromise, maybePay.address)
    requestsByHash[paymentRequest.message.serverSecretHash] = paymentRequest
    res.status(402).json(paymentRequest.message)
    return
  }

  const payment = msgpackr.decode(base64url.toBuffer(req.headers['x-maybe-payment']))

  const paymentRequest = requestsByHash[payment.serverSecretHash]

  if (!paymentRequest) {
    res.status(400).json({ error: 'payment does not match any requests' })
    return
  }

  const checkResult = await MaybePayLib.check(paymentRequest, payment, maybePay)

  if (checkResult.invalidReasons.length > 0) {
    res.status(400).json({ error: 'payment is not valid', invalidReasons })
    return
  }

  delete requestsByHash[payment.serverSecretHash]

  res.status(200).json({
    result: [
      {
        city: "Gangnam-Gu",
        type: "Cloudy",
        img: "https://commvault.com/wp-content/uploads/2021/06/cloud-scale03.svg"
      }
    ]
  })

  if (checkResult.triggeredAmount.gt(0)) {
    setTimeout(async () => {
      await MaybePayLib.claim(paymentRequest, payment, maybePay)
    });
  }
}
