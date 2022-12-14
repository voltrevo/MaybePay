import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'
import axios from "axios"
import { ethers } from "ethers";
import * as MaybePayLib from "../utils/MaybePayLib"
import callMaybePayApi from '../utils/callMaybePayApi'

const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');

const wallet = new ethers.Wallet(
  // CAUTION: This is a private key. It's ok because it's just a testnet wallet.
  // Publishing a private key with real funds attached will cause the funds inside
  // to be drained by hackers.
  '203dfb3d0be339976af754905c0507029d92afc5eb19751c9f6e4bfa6a8dcefd',
  provider,
);

const ethUsd = 1853;

export default function Home() {
  const [weather, setWeather] = useState([])
  const [news, setNews] = useState([])
  const [balance, setBalance] = useState()
  const [depositMsg, setDepositMsgReact] = useState()
  const [depositBalance, setDepositBalance] = useState()
  const [chainUpdates, setChainUpdates] = useState(0)

  const setDepositMsg = (msg) => {
    if (msg instanceof Error) {
      console.error(msg)
      setDepositMsgReact(msg.message)
    } else {
      setDepositMsgReact(msg)
      console.log(msg)
    }
  }

  useEffect(() => {
    const getWeatherData = async () => {
      const parsedEth = ethers.utils.parseEther('0.000001')
      const paymentRequest = MaybePayLib.request(
        parsedEth,
        wallet.address,
        80001,
        "0x78E0B95781634F6E993B088019FB761ed7Dc4593",
        ethers.BigNumber.from(5),
      )

      const payment = await MaybePayLib.pay(
        paymentRequest.message,
        ethers.utils.parseEther('0.1'),
        wallet,
        ethers.BigNumber.from(2),
      )

      // const _res = await axios.post("/api/to_pay_or_not_to_pay", {
      //   payment,
      //   paymentRequest
      // })
      // console.log(_res.data)

      const res = await callMaybePayApi("/api/weather", ethers.utils.parseEther('0.0001'))
      setWeather(res.result)
    }

    const getNewsData = async () => {
      const res = await axios.get("/api/news")
      setNews(res.data.result)
    }

    const _getWeatherData = async () => {
      const res = await axios.get("/api/weather")
      setWeather(res.data.result)
    }

    getWeatherData()
    getNewsData()
  }, [])

  useEffect(() => {
    provider.getBalance(wallet.address).then(balance => {
      const ethBalance = Number(ethers.utils.formatEther(balance));
      setBalance(ethBalance);
    })

    const maybePay = MaybePayLib.connect("0x78E0B95781634F6E993B088019FB761ed7Dc4593", wallet)

    maybePay.balances(wallet.address).then(depositBalance => {
      const ethDepositBalance = Number(ethers.utils.formatEther(depositBalance))
      setDepositBalance(ethDepositBalance)
    })
  }, [chainUpdates])

  const deposit = async (evt) => {
    try {
      const inputField = evt.target.parentElement.querySelector('.deposit-amt')
      const dollarAmtText = inputField.value
      const dollarAmt = Number(dollarAmtText);

      if (!Number.isFinite(dollarAmt) || dollarAmtText.trim() === '') {
        setDepositMsg(new Error(`Invalid deposit amount: "${dollarAmtText}"`))
        return
      }

      const ethAmt = dollarAmt / ethUsd

      inputField.value = ''
      setDepositMsg(`depositing $${dollarAmt.toFixed(2)} (=${ethAmt.toFixed(4)} ETH) ...`)

      const tx = {
        from: wallet.address,
        to: "0x78E0B95781634F6E993B088019FB761ed7Dc4593",
        value: ethers.utils.parseEther(ethAmt.toFixed(18)),
        nonce: provider.getTransactionCount(wallet.address, "latest"),
        gasLimit: ethers.utils.hexlify("0x100000"), // 100000
        gasPrice: provider.getGasPrice(),
      }

      let walletSigner = wallet.connect(provider)
      const transaction = await walletSigner.sendTransaction(tx)
      console.dir(transaction)
      setDepositMsg('deposit submitted, waiting for confirmation...')
      await transaction.wait()
      setDepositMsg('deposit confirmed')
      setChainUpdates(chainUpdates + 1)
    } catch (error) {
      setDepositMsg(error);
    }
  }

  return (
    <div className='w-[100vw] h-full p-2'>
      <Head>
        <title>MaybePay</title>
      </Head>
      <div className='text-[4vw] font-ProtoMono-Light mb-10 text-center'>
        End-User Interface
      </div>
      <div className='flex w-full h-[80vw] space-x-20 justify-center' id="container">
        <div className='w-[45vw] space-y-20' id="left-side">
          <div className='h-[17vw] w-full' id="API1-widget">
            <div className='text-[1.6vw] font-ProtoMono-Light'>User1 - API 1 (Weather Widget)</div>
            <div className='h-full border-2 border-black' id="API1-widget-container">
              <div className='h-[1.6vw] pt-2 bg-black' id="weather-top-menu">
                <div className='flex h-full' id="tab">
                  <div className='rounded-t-lg w-[20%]' id="tab-1"></div>
                  <div className='w-[80%]' id="empty-space"></div>
                </div>
                <div className='bg-gray-500 h-[1.6vw] w-[100%]' id="url-container">
                  <div id="url" className="text-slate-50 pl-2">
                    weather widget
                  </div>
                  <div id="extension"></div>
                </div>
              </div>
              <div id="weather-contents" className="mt-10 flex w-[100%] justify-evenly items-center">
                <img className="h-[200px] mr-10" src="https://commvault.com/wp-content/uploads/2021/06/cloud-scale03.svg" alt="Clouds" />
                <div className="mr-10">
                  <p className="text-6xl font-ProtoMono-Light">{weather.length !== 0 ? weather[0].type : "Loading..."}</p>
                  <p className="text-2xl font-ProtoMono-Light">in {weather.length !== 0 ? weather[0].city : "Loading..."}</p>
                </div>
              </div>
            </div>
          </div>
          <div className=' h-[35vw]' id="API2-widget">
            <div className='text-[1.6vw] font-ProtoMono-Light '>User1 - API 2 (News Widget)</div>
            <div className='h-full bg-white border-2 border-black' id='API3-widget-container'>
              <div className='h-[1.6vw] pt-2 bg-black' id="weather-top-menu">
                <div className='flex h-full' id="tab">
                  <div className='rounded-t-lg w-[20%]' id="tab-1"></div>
                  <div className='w-[80%]' id="empty-space"></div>
                </div>
                <div className='bg-gray-500 h-[1.6vw] w-[100%]' id="url-container">
                  <div id="url" className="text-slate-50 pl-2">
                    news widget
                  </div>
                  <div id="extension"></div>
                </div>
              </div>
              <div id="news-contents" className="mt-10 ml-5 flex w-[100%] justify-center items-center">
              <div className='flex-col w-full h-[50%]'>
              <div id="tesla" className='bg-white h-[20vw] w-[96%] mb-10' style={{
                  background: 'url(/static/tesla.png) center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                }}>
                </div>
                  <div className="mr-10">
                    <p className="text-[1.2vw] font-ProtoMono-Light font-extrabold  mb-5">{news.length !== 0 ? news[0].title : "Loading..."}</p>
                    <p className="text-[0.8vw] font-ProtoMono-Light mb-5">{news.length !== 0 ? news[0].description : "Loading..."}</p>
                  </div>
              </div>
              </div>
            </div>
          </div>
        </div>
        <div className='w-[26vw] h-auto' id="right-side">
          <div className='font-ProtoMono-SemiBold ' id='wallet'>
            <div className='text-[1.6vw] font-ProtoMono-Light'>User1 Wallet</div>
            <div className='w-full h-[58vw] rounded-xl bg-blue-100  p-5' id="wallet-container">
              <div className='bg-blue-500 rounded-xl pb-5' id="wallet-top">
                <div className='flex-col text-center justify-center px-5 pt-8 pb-8 space-y-4' id="wallet-address">
                  <div className='text-[1.1.6vw]'>Wallet Address</div>
                  <div className='text-[1vw]'>- Account 1 -</div>
                  <div className='text-[0.7vw]'>{wallet.address}</div>
                </div>
                <div id="wallet-balance" className='flex rounded-xl mx-5 bg-gray-50 justify-around  items-center py-5 px-2 space-x-5'>
                  <div className='flex-col justify-center items-center'>
                    <div>
                      <div className=' text-center'>Wallet</div><div className=' text-center'>Current Balance</div>
                    </div>
                    <div className='text-center text-[1.3vw] pt-2'>$ {balance && (ethUsd * balance).toFixed(2)}</div>
                  </div>
                  <div className='border-2 border-gray-300  h-[4vw] w-1' id="divider"></div>
                  <div className=' flex-col justify-center items-center'>
                    <div>
                      <div className=' text-center'>MaybePay</div><div className='text-center'>Deposit Balance</div>
                    </div>
                    <div className='text-center text-[1.3vw] pt-2'>$ {depositBalance && (ethUsd * depositBalance).toFixed(2)}</div>
                  </div>
                </div>
              </div>
              <div className='w-full flex-col py-4' id="deposit input">
                <span className='block'>Amount to MaybePay Deposit</span>
                <div className='flex space-x-3'>
                  <input className='deposit-amt w-full rounded-md border-blue-200 border-2 p-1'></input>
                  <button onClick={(evt) => deposit(evt)} className='rounded-lg text-sm bg-blue-300 p-2 hover:bg-blue-600 hover:text-white'>Deposit</button>
                </div>
                <div>
                  {depositMsg}
                </div>
              </div>
              <div class="flex items-center py-2">
                <input checked id="checked-checkbox" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500  focus:ring-2 " />
                <label for="checked-checkbox" class="ml-2 text-sm font-medium text-gray-900 ">Auto approve minimum threshold - $ 0.20/hour</label>
              </div>
              <div className='py-3' id="Outgoing-Payment-List">
                <span className='container'>Outgoing Payment List</span>
                <div className='bg-white h-auto flex-col px-1 py-3 space-y-3' id="payment-container">
                  <div className='flex justify-between bg-slate-200 '>
                    <span className='block'>Today</span><span className='block'> - $ 0.2512</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='block'>API 1</span><span className='block'>$ 0.0005</span>
                  </div>
                  <div className='flex justify-between bg-slate-200'>
                    <span className='block'>API 2</span><span className='block'>$ 0.0015</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='block'>API 1</span><span className='block'>$ 0.0103</span>
                  </div>
                  <div className='flex justify-between bg-slate-200'>
                    <span className='block'>API 1</span><span className='block'>$ 0.0050</span>
                  </div>
                </div>
              </div>
              <div className='h-[13vw] w-full' id="Graph">
                <span>Graph</span>
                <div className='bg-white h-full' style={{
                  background: 'url(/static/expectedActual.png) center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                }}>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
