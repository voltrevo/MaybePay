// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    result: [
      {
        city: "Gangnam-Gu",
        type: "Cloudy",
        img: "https://commvault.com/wp-content/uploads/2021/06/cloud-scale03.svg"
      }
    ]
  })
}
