import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
    return(
    <div className='flex-col w-full h-full justify-center items-center p-[6.5rem]'>
      <Head>
        <title>MaybePay</title>
      </Head>
      <div className='text-[5vw] font-ProtoMono-Light text-center'>
        Owner Setting Page
      </div>
      <div className='flex-col space-y-10 w-auto text-[2vw] font-ProtoMono-Light ' id="owner-container">
        <div className='w-[100vw] h-[20vw] border-2 border-black ' id="owner-top">
            <div className='' id="owner-api-list">

            </div>
        </div>
        <div className='flex w-[100vw] h-[20vw] space-x-10'  id="owner-bottom">
            <div className='w-1/2 h-full' id="API-owner-revenue">
                <div className=''>API Owner Revenue</div>
                <div className='border-black border-2' id="revenue-container">
                    
                </div>
            </div>
            <div className='w-1/2 h-full ' id="maybepay-logs">
                <div className=''>MaybePay Logs</div>
                <div className='border-black border-2' id="logs-container">
                    Time
                </div>
            </div>
        </div>
      </div>
    </div>
    )
}