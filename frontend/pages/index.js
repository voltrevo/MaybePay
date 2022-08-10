import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
    return(
        <div className='w-[100vw] h-full p-2'>
      <Head>
        <title>MaybePay</title>
      </Head>
      <div className='text-[5vw] font-ProtoMono-Light my-4  text-center'>
        Owner Setting Page
      </div>
      <div className='flex-col w-full h-[80vw] space-x-20 justify-center' id="owner-container">
        <div className='' id="owner-top">

        </div>
        <div className='flex' id="owner-bottom">
            <div id="API-owner-revenue"></div>
            <div id="maybepay-logs"></div>
        </div>
      </div>
    </div>
    )
}