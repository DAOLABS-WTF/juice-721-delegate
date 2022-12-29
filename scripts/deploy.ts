import * as fs from 'fs';
import * as hre from 'hardhat';
import { deployRecordContract, getContractRecord, logger } from './lib/lib';

const parentDir = '../dl-jbx3'; // NOTE: this depends on the local machine, relative to execution dir

async function main() {
    const deploymentLogPath = `./deployments/${hre.network.name}/nft-rewards.json`;
    if (!fs.existsSync(deploymentLogPath)) {
        fs.writeFileSync(deploymentLogPath, `{ "${hre.network.name}": { }, "constants": { } }`);
    }

    logger.info(`deploying DAOLABS Juicebox v3, nft rewards, fork to ${hre.network.name}`);

    const [deployer] = await hre.ethers.getSigners();
    logger.info(`connected as ${deployer.address}`);

    await deployRecordContract('JBTiered721Delegate', [], deployer, 'JBTiered721Delegate', deploymentLogPath);
    await deployRecordContract('JB721GlobalGovernance', [], deployer, 'JB721GlobalGovernance', deploymentLogPath);
    await deployRecordContract('JB721TieredGovernance', [], deployer, 'JB721TieredGovernance', deploymentLogPath);
    await deployRecordContract('JBTiered721DelegateStore', [], deployer, 'JBTiered721DelegateStore', deploymentLogPath);

    const jbTiered721DelegateAddress = getContractRecord('JBTiered721Delegate', deploymentLogPath).address;
    const jb721GlobalGovernanceAddress = getContractRecord('JB721GlobalGovernance', deploymentLogPath).address;
    const jb721TieredGovernanceAddress = getContractRecord('JB721TieredGovernance', deploymentLogPath).address;
    await deployRecordContract('JBTiered721DelegateDeployer', [
        jb721GlobalGovernanceAddress,
        jb721TieredGovernanceAddress,
        jbTiered721DelegateAddress
    ], deployer, 'JBTiered721DelegateDeployer', deploymentLogPath);

    const jbTiered721DelegateDeployerAddress = getContractRecord('JBTiered721DelegateDeployer', deploymentLogPath).address;
    const jbControllerAddress = getContractRecord('JBController', `${parentDir}/deployments/${hre.network.name}/platform.json`).address;
    const jbOperatorStoreAddress = getContractRecord('JBOperatorStore', `${parentDir}/deployments/${hre.network.name}/platform.json`).address;
    await deployRecordContract('JBTiered721DelegateProjectDeployer', [
        jbControllerAddress,
        jbTiered721DelegateDeployerAddress,
        jbOperatorStoreAddress
    ], deployer, 'JBTiered721DelegateProjectDeployer', deploymentLogPath);

    logger.info('deployment complete');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// npx hardhat run scripts/deploy.ts --network goerli
