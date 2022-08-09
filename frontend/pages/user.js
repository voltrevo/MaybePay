import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className='w-[100vw] h-full p-[2vw] '>
    <Head>
      <title>MaybePay</title>
    </Head>
    <div className='text-[5vw] font-ProtoMono-Light my-4  text-center'>
      End-User Interface
    </div>
    <div className='flex w-full h-[80vw] space-x-20 justify-center' id="container">
      <div className='w-[45vw] space-y-20' id="left-side">
        <div className='h-[21vw] w-full' id="weather-widget">
          <div className='text-[2vw] font-ProtoMono-Light '>User1 - API 1 (Weather Widget)</div>
          <div className='h-full border-2 border-black' id="weather-container">
            <div className='h-[2vw] pl-2 pt-2 bg-black' id="weather-top-menu">
              <div className='flex h-full bg-gray-800 ' id="tab">
                <div className='rounded-t-lg bg-gray-600 w-[20%]' id="tab-1"></div>
                <div className='bg-gray-800 w-[80%]' id="empty-space"></div>
              </div>
              <div className='bg-gray-500 h-[2vw]' id="url-container">
                <div id="url"></div>
                <div id="extension"></div>
              </div>
            </div>
            <div id="weather-contents"></div>
          </div>
        </div>
        <div className=' h-[16vw]' id="-widget">
          <div className='text-[2vw] font-ProtoMono-Light '>User1 - API 2</div>
          <div className='h-full bg-gray-300 p-4 border-2 border-black ' id='logs-container'></div>
        </div>
      </div>
      <div className='w-[30vw] h-[20vw]' id="right-side">
        <div id='wallet'>
          <div className='text-[2vw] font-ProtoMono-Light'>Wallet</div>
          <div className='w-full h-[42vw]  border-2 border-black  rounded-lg bg-green-200 p-10' id="wallet-container">
            <div className='bg-blue-700' id="wallet-top">
              <div className='flex-col text-center justify-center p-10' id="wallet-address">
                <div>Wallet Address</div>
                <div>0xb89C33bE71c2aAd77d6712b1AD47274aD9fb7dcb</div>
              </div>
              <div id="wallet-balance" className='flex bg-gray-200 justify-around  items-center    '>
                <div  className='flex-col justify-center items-center'>
                  <span className='block text-center'>Wallet</span><span className='block text-center'>Current Balance</span>
                  <div className='text-center'>$ 320</div>
                </div>
                <div className=' flex-col justify-center items-center'>
                  <span className='block text-center'>MaybePay</span><span className='block'>Deposit Balance</span>
                  <div className='text-center'>$ 10</div>
                </div>
              </div>
            </div>
            <div>Amount to MaybePay</div>
            <div>Graph</div>
          </div>
        </div>
        
      </div>
    </div>
   </div>
  )
}
