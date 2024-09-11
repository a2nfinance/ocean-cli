// interactiveFlow.ts
import { prompt } from 'enquirer';
import { PublishAssetParams } from './publishAsset'; // Import the correct type

// Validation functions
const validateIPFS = (input: string) =>
  /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(input) || 'Invalid IPFS hash format.';
const validateArweave = (input: string) =>
  /^[a-zA-Z0-9_-]{43,}$/.test(input) || 'Invalid Arweave transaction ID format.';
const validateURL = (input: string) =>
  /^(https?:\/\/)[^\s/$.?#].[^\s]*$/.test(input) || 'Invalid URL format.';

export async function interactiveFlow(providerUrl: string): Promise<PublishAssetParams> {
  try {
    // Prompting for basic information
    const basicAnswers = await prompt<PublishAssetParams>([
      {
        type: 'input',
        name: 'title',
        message: 'What is the title of your asset?\n',
        required: true
      },
      {
        type: 'input',
        name: 'description',
        message: 'Please provide a description of your asset:\n',
        required: true
      },
      {
        type: 'input',
        name: 'author',
        message: 'Who is the Author of this asset?\n',
        required: true
      },
      {
        type: 'list',
        name: 'tags',
        message: 'Please provide tags to make this asset more easily discoverable (comma separated):\n',
        required: true
      },
      {
        type: 'select',
        name: 'timeout',
        message: 'After purchasing your asset, how long should the consumer be allowed to access it for?\n',
        choices: [
          {name: 'Forever', value: 0},
          {name: '1 day', value: 86400},
          {name: '1 week', value: 604800},
          {name: '1 month', value: 2592000},
          {name: '1 year', value: 31536000}
        ],
        required: true
      },
    ]);

    // Prompting for technical details - first, get storage type
    const { storageType } = await prompt<{ storageType: PublishAssetParams['storageType'] }>([
      {
        type: 'select',
        name: 'storageType',
        message: 'How is your asset stored?\n',
        choices: [{name: 'IPFS', value: 'ipfs'}, {name: 'Arweave', value: 'arweave'}, {name: 'URL', value: 'url'}],
        required: true
      },
    ]);

    // Determine assetLocation message and validation based on storageType
    let assetLocationMessage = 'Please provide the location of your asset:\n';
    let validateFunction;
    if (storageType === 'IPFS') {
      assetLocationMessage = 'Please provide the IPFS hash for your asset:\n';
      validateFunction = validateIPFS;
    } else if (storageType === 'Arweave') {
      assetLocationMessage = 'Please provide the Arweave transaction ID for your asset:\n';
      validateFunction = validateArweave;
    } else if (storageType === 'URL') {
      assetLocationMessage = 'Please provide the URL for your asset:\n';
      validateFunction = validateURL;
    }

    // Prompt for asset location with validation
    const { assetLocation } = await prompt<{ assetLocation: string }>([
      {
        type: 'input',
        name: 'assetLocation',
        message: assetLocationMessage,
        validate: validateFunction,
        required: true
      },
    ]);

    // Prompt for whether the asset is charged or free
    const { isCharged } = await prompt<{ isCharged: PublishAssetParams['isCharged'] }>([
      {
        type: 'toggle',
        name: 'isCharged',
        message: 'Will you charge for this asset?\n',
        initial: 'Paid',
        enabled: 'Paid',
        disabled: 'Free',
        required: true
      },
    ]);

    // Check if isCharged is 'Paid' to ask further questions about payment
    let paymentDetails = {};
    if (isCharged === 'Paid') {
      paymentDetails = await prompt<Partial<PublishAssetParams>>([
        {
          type: 'select',
          name: 'token',
          message: 'What token will you accept payments in?\n',
          choices: ['OCEAN', 'H2O'],
        },
        {
          type: 'input',
          name: 'price',
          message: 'What is the price to access your asset?\n',
        },
      ]);
    }

    // Prompt for network selection
    const { network } = await prompt<{ network: PublishAssetParams['network'] }>([
      {
        type: 'select',
        name: 'chainId',
        message: 'What network will your asset be available for purchase through?\n',
        choices: [{name: 'Oasis Sapphire', value: 23294}, {name: 'Ethereum', value: 1}, {name: 'Polygon', value: 137}],
        initial: 0,
        required: true
      },
    ]);

    // Conditionally prompt for template if the network is not 'Oasis Sapphire'
    const templateAnswer = network !== 'Oasis Sapphire'
      ? await prompt<Partial<PublishAssetParams>>([
          {
            type: 'select',
            name: 'template',
            message: 'Which template would you like to use?\n',
            choices: [
              { name: 'Template 1 - user can buy, sell & hold datatokens.', value: 1 },
              { name: 'Template 2 - assets are purchased with basetokens and the effective supply of datatokens is always zero.', value: 2 },
            ],
          },
        ])
      : {};

    // Combine all answers
    const allAnswers: PublishAssetParams = {
      ...basicAnswers,
      storageType,
      assetLocation,
      isCharged,
      ...paymentDetails,
      network,
      ...templateAnswer,
      providerUrl // Add provider URL directly here
    };

    console.log('\nHere are your responses:');
    console.log(allAnswers);

    return allAnswers; 
  } catch (error) {
    console.error('An error occurred during the prompt:', error);
    throw error;
  }
}
