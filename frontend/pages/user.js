import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className='w-[100vw] h-full p-2'>
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
      <div className='w-[26vw] h-[20vw]' id="right-side">
        <div className='font-ProtoMono-SemiBold ' id='wallet'>
          <div className='text-[2vw] font-ProtoMono-Light'>User1 Wallet</div>
          <div className='w-full h-[42vw] rounded-xl bg-blue-100  p-5' id="wallet-container">
            <div className='bg-blue-500 rounded-xl pb-5' id="wallet-top">
              <div className='flex-col text-center justify-center px-5 pt-8 pb-8 space-y-4' id="wallet-address">
                <div className='text-[1.2vw]'>Wallet Address</div>
                <div className='text-[1vw]'>- Account 1 -</div>
                <div className='text-[0.7vw]'>0xb89C33bE71c2aAd77d6712b1AD47274aD9fb7dcb</div>
              </div>
              <div id="wallet-balance" className='flex rounded-xl mx-5 bg-gray-50 justify-around  items-center py-5 px-2 space-x-5'>
                <div  className='flex-col justify-center items-center'>
                  <div>
                    <div className=' text-center'>Wallet</div><div className=' text-center'>Current Balance</div>
                  </div>
                  <div className='text-center text-[1.3vw] pt-2'>$ 320</div>
                </div>
                <div className='border-2 border-gray-300  h-[4vw] w-1' id="divider"></div>
                <div className=' flex-col justify-center items-center'>
                  <div>
                    <div className=' text-center'>MaybePay</div><div className='text-center'>Deposit Balance</div>
                  </div>
                  <div className='text-center text-[1.3vw] pt-2'>$ 10</div>
                </div>
              </div>
            </div>
            <div className='w-full flex-col py-4' id="deposit input">
              <span className='block'>Amount to MaybePay Deposit</span>
              <div className='flex space-x-3'>
              <input className='w-full rounded-md border-blue-200 border-2 p-1'></input>
              <button className='rounded-lg text-sm bg-blue-300 p-2'>Deposit</button>
              </div>
            </div>
            <div class="flex items-center py-2">
              <input checked id="checked-checkbox" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500  focus:ring-2 " />
              <label for="checked-checkbox" class="ml-2 text-sm font-medium text-gray-900 ">Auto approve minimum threshold - $ 0.20</label>
          </div>
            <div className='py-3' id="Outgoing-Payment-List">
              <span className='container'>Outgoing Payment List</span>
              <div className='bg-white h-auto flex-col px-1 py-3 space-y-3' id="payment-container">
                <div className='flex justify-between bg-slate-200 '>
                  <span className='block'>Today</span><span className='block'> - $ 3.25</span>
                </div>
                <div className='flex justify-between'>
                  <span className='block'>API 1</span><span className='block'>$ 0.05</span>
                </div>
                <div className='flex justify-between bg-slate-200'>
                  <span className='block'>API 2</span><span className='block'>$ 0.15</span>
                </div>
                <div className='flex justify-between'>
                  <span className='block'>API 1</span><span className='block'>$ 1.03</span>
                </div>
                <div className='flex justify-between bg-slate-200'>
                  <span className='block'>API 1</span><span className='block'>$ 0.5</span>
                </div>
              </div>
            </div>
            <div>Graph</div>
          </div>
        </div>
        
      </div>
    </div>
   </div>
  )
}
