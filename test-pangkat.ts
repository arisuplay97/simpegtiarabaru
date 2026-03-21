import { getEligibleKenaikanPangkat } from "./lib/actions/pangkat"

async function test() {
  console.log("Fetching eligible pangkat...")
  const res = await getEligibleKenaikanPangkat()
  console.log("Eligible:", res.length)
  console.log(JSON.stringify(res, null, 2))
}

test()
