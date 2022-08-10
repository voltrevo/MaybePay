// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import abi from "../../abi"
import { check } from "../../utils/server"
import { ethers } from "ethers"

export default async function handler(req, res) {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
    const contract = new ethers.Contract("0x78E0B95781634F6E993B088019FB761ed7Dc4593", abi, provider)

    const checked = await check(req.body.paymentRequest, req.body.payment, contract)
    console.log(checked)
    res.status(200).json({
        pay: true
    })
  }
  