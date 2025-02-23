const MAX_INT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const diamond = require('./diamond.js')
const { 
  impersonateBean, 
  impersonateCurve,
  impersonateBean3CrvMetapool, 
  impersonateWeth, 
  impersonateUnripe, 
  impersonateFertilizer,
  impersonatePrice,
  impersonateBlockBasefee,
  impersonateEthUsdcUniswap,
  impersonateEthUsdtUniswap,
  impersonateEthUsdChainlinkAggregator,
  impersonateBeanEthWell
} = require('./impersonate.js')

function addCommas(nStr) {
  nStr += ''
  const x = nStr.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

function strDisplay(str) {
  return addCommas(str.toString())
}

async function main(scriptName, verbose = true, mock = false, reset = true) {
  if (verbose) {
    console.log('SCRIPT NAME: ', scriptName)
    console.log('MOCKS ENABLED: ', mock)
  }

  if (mock && reset) {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  }

  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  if (verbose) {
    console.log('Account: ' + account)
    console.log('---')
  }
  let tx
  let totalGasUsed = ethers.BigNumber.from('0')
  let receipt
  const name = 'Beanstalk'


  async function deployFacets(verbose,
    facets,
    libraryNames = [],
    facetLibraries = {},
  ) {
    const instances = []
    const libraries = {}

    for (const name of libraryNames) {
      if (verbose) console.log(`Deploying: ${name}`)
      let libraryFactory = await ethers.getContractFactory(name)
      libraryFactory = await libraryFactory.deploy()
      await libraryFactory.deployed()
      const receipt = await libraryFactory.deployTransaction.wait()
      if (verbose) console.log(`${name} deploy gas used: ` + strDisplay(receipt.gasUsed))
      if (verbose) console.log(`Deployed at ${libraryFactory.address}`)
      libraries[name] = libraryFactory.address
    }

    for (let facet of facets) {
      let constructorArgs = []
      if (Array.isArray(facet)) {
        ;[facet, constructorArgs] = facet
      }
      let factory;
      if (facetLibraries[facet] !== undefined) {
        let facetLibrary = Object.keys(libraries).reduce((acc, val) => {
          if (facetLibraries[facet].includes(val)) acc[val] = libraries[val];
          return acc;
        }, {});
        factory = await ethers.getContractFactory(facet, {
          libraries: facetLibrary
        },
        );
      } else {
        factory = await ethers.getContractFactory(facet)
      }
      const facetInstance = await factory.deploy(...constructorArgs)
      await facetInstance.deployed()
      const tx = facetInstance.deployTransaction
      const receipt = await tx.wait()
      if (verbose) console.log(`${facet} deploy gas used: ` + strDisplay(receipt.gasUsed))
      totalGasUsed = totalGasUsed.add(receipt.gasUsed)
      instances.push(facetInstance)
    }
    return instances
  }

  // A list of public libraries that need to be deployed separately.
  const libraryNames = [
    'LibGauge', 'LibIncentive', 'LibConvert', 'LibLockedUnderlying', 'LibCurveMinting'
  ]

  // A mapping of facet to public library names that will be linked to it.
  const facetLibraries = {
    'SeasonFacet': [
      'LibGauge',
      'LibIncentive',
      'LibLockedUnderlying',
    ],
    'MockSeasonFacet': [
      'LibGauge',
      'LibIncentive',
      'LibLockedUnderlying',
      'LibCurveMinting'
    ],
    'SeasonGettersFacet': [
      'LibLockedUnderlying'
    ],
    'ConvertFacet': [
      'LibConvert'
    ],
    'MockConvertFacet': [
      'LibConvert'
    ],
    'MockUnripeFacet': [
      'LibLockedUnderlying'
    ],
    'UnripeFacet': [
      'LibLockedUnderlying'
    ]
  }

  let [
    bdvFacet,
    curveFacet,
    migrationFacet,
    approvalFacet,
    convertFacet,
    convertGettersFacet,
    enrootFacet,
    farmFacet,
    fieldFacet,
    fundraiserFacet,
    marketplaceFacet,
    ownershipFacet,
    pauseFacet,
    depotFacet,
    seasonFacet,
    seasonGettersFacet,
    siloFacet,
    fertilizerFacet,
    tokenFacet,
    tokenSupportFacet,
    unripeFacet,
    whitelistFacet,
    metadataFacet,
    gaugePointFacet,
    siloGettersFacet,
    liquidityWeightFacet
  ] = mock ? await deployFacets(
    verbose,
    [ 
      'BDVFacet',
      'CurveFacet',
      'MigrationFacet',
      'ApprovalFacet',
      'MockConvertFacet',
      'ConvertGettersFacet',
      'EnrootFacet',
      'FarmFacet',
      'MockFieldFacet',
      'MockFundraiserFacet',
      'MockMarketplaceFacet',
      'PauseFacet',
      'DepotFacet',
      'MockSeasonFacet',
      'SeasonGettersFacet',
      'MockSiloFacet',
      'MockFertilizerFacet',
      'OwnershipFacet',
      'TokenFacet',
      'TokenSupportFacet',
      'MockUnripeFacet',
      'MockWhitelistFacet',
      'MetadataFacet',
      'GaugePointFacet',
      'SiloGettersFacet',
      'LiquidityWeightFacet'
    ],
    libraryNames,
    facetLibraries
  ) : await deployFacets(
    verbose,
    [ 
      'BDVFacet',
      'CurveFacet',
      'MigrationFacet',
      'ApprovalFacet',
      'ConvertFacet',
      'ConvertGettersFacet',
      'EnrootFacet',
      'FarmFacet',
      'FieldFacet',
      'FundraiserFacet',
      'MarketplaceFacet',
      'OwnershipFacet',
      'PauseFacet',
      'DepotFacet',
      'SeasonFacet',
      'SeasonGettersFacet',
      'SiloFacet',
      'FertilizerFacet',
      'TokenFacet',
      'TokenSupportFacet',
      'UnripeFacet',
      'WhitelistFacet',
      'MetadataFacet',
      'GaugePointFacet',
      'SiloGettersFacet',
      'LiquidityWeightFacet'
    ],
    libraryNames,
    facetLibraries
  )
  const initDiamondArg = mock ? 'contracts/mocks/MockInitDiamond.sol:MockInitDiamond' : 'contracts/farm/init/InitDiamond.sol:InitDiamond'
  // eslint-disable-next-line no-unused-vars

  let args = []
  if (mock) {
    await impersonateBean()
    await impersonatePrice()
    if (reset) {
      await impersonateCurve()
      await impersonateWeth()
      await impersonateEthUsdcUniswap()
      await impersonateEthUsdtUniswap()
    }
    await impersonateBean3CrvMetapool()
    await impersonateUnripe()
    await impersonateFertilizer()
    await impersonateBlockBasefee();
    await impersonateEthUsdChainlinkAggregator()
  }

  const [beanstalkDiamond, diamondCut] = await diamond.deploy({
    diamondName: 'BeanstalkDiamond',
    initDiamond: initDiamondArg,
    facets: [
      ['BDVFacet', bdvFacet],
      ['CurveFacet', curveFacet],
      ['MigrationFacet', migrationFacet],
      ['ApprovalFacet', approvalFacet],
      ['ConvertFacet', convertFacet],
      ['ConvertGettersFacet', convertGettersFacet],
      ['EnrootFacet', enrootFacet],
      ['FarmFacet', farmFacet],
      ['FieldFacet', fieldFacet],
      ['FundraiserFacet', fundraiserFacet],
      ['MarketplaceFacet', marketplaceFacet],
      ['OwnershipFacet', ownershipFacet],
      ['PauseFacet', pauseFacet],
      ['DepotFacet', depotFacet],
      ['SeasonFacet', seasonFacet],
      ['SeasonGettersFacet', seasonGettersFacet],
      ['SiloFacet', siloFacet],
      ['FertilizerFacet', fertilizerFacet],
      ['TokenFacet', tokenFacet],
      ['TokenSupportFacet', tokenSupportFacet],
      ['UnripeFacet', unripeFacet],
      ['WhitelistFacet', whitelistFacet],
      ['MetadataFacet', metadataFacet],
      ['GaugePointFacet', gaugePointFacet],
      ['SiloGettersFacet', siloGettersFacet],
      ['LiquidityWeightFacet', liquidityWeightFacet]
    ],
    owner: account,
    args: args,
    verbose: verbose,
    impersonate: mock && reset
  });

  tx = beanstalkDiamond.deployTransaction
  if (!!tx) {
    receipt = await tx.wait()
    if (verbose) console.log('Beanstalk diamond deploy gas used: ' + strDisplay(receipt.gasUsed))
    if (verbose) console.log('Beanstalk diamond cut gas used: ' + strDisplay(diamondCut.gasUsed))
    totalGasUsed = totalGasUsed.add(receipt.gasUsed).add(diamondCut.gasUsed)
  }

  if (verbose) {
    console.log("--");
    console.log('Beanstalk diamond address:' + beanstalkDiamond.address)
    console.log("--");
  }

  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', beanstalkDiamond.address)

  if (verbose) console.log('Total gas used: ' + strDisplay(totalGasUsed))
  return {
    account: account,
    beanstalkDiamond: beanstalkDiamond,
    diamondLoupeFacet: diamondLoupeFacet,
    bdvFacet,
    convertFacet,
    convertGettersFacet,
    enrootFacet,
    migrationFacet,
    approvalFacet,
    farmFacet,
    fieldFacet,
    fundraiserFacet,
    marketplaceFacet,
    ownershipFacet,
    pauseFacet,
    depotFacet,
    seasonFacet,
    seasonGettersFacet,
    siloFacet,
    fertilizerFacet,
    tokenFacet,
    tokenSupportFacet,
    unripeFacet,
    metadataFacet,
    gaugePointFacet,
    siloGettersFacet,
    liquidityWeightFacet
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
exports.deploy = main
