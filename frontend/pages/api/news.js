// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
    res.status(200).json({
      result: [
        {
            author: "Reuters",
            title: "Tesla discloses lobbying effort to set up factory in Canada",
            description: "(Reuters) - Tesla Inc is lobbying the Ontario government as part of an effort to set up an \"advanced manufacturing facility\" in Canada, a filing by the...."
        }
      ]
    })
  }
  