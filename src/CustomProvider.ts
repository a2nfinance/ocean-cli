import {
  ComputeAlgorithm,
  ComputeAsset,
  ComputeJob,
  ComputeOutput,
  LoggerInstance,
  Provider
} from "@oceanprotocol/lib";

import { Signer } from 'ethers';
class CustomProvider extends Provider {
  /** Instruct the provider to start a compute job
 * @param {string} providerUri The provider URI.
 * @param {Signer} signer The consumer signer object.
 * @param {string} computeEnv The compute environment.
 * @param {ComputeAsset} dataset The dataset to start compute on
 * @param {ComputeAlgorithm} algorithm The algorithm to start compute with.
 * @param {AbortSignal} signal abort signal
 * @param {ComputeAsset[]} additionalDatasets The additional datasets if that is the case.
 * @param {ComputeOutput} output The compute job output settings.
 * @return {Promise<ComputeJob | ComputeJob[]>} The compute job or jobs.
 */
  public async computeStart(
    providerUri: string,
    consumer: Signer,
    computeEnv: string,
    dataset: ComputeAsset,
    algorithm: ComputeAlgorithm,
    signal?: AbortSignal,
    additionalDatasets?: ComputeAsset[],
    output?: ComputeOutput
  ): Promise<ComputeJob | ComputeJob[]> {
    const providerEndpoints = await super.getEndpoints(providerUri)
    const serviceEndpoints = await super.getServiceEndpoints(
      providerUri,
      providerEndpoints
    )

    // If the compute engine is free then using 'startFreeCompute' to avoid this error:
    // Compute start failed:  500 Internal Server Error Free Jobs cannot be started here, use startFreeCompute
    // Default vallue is 'computeStart'

    let computeStartUrl = super.getEndpointURL(serviceEndpoints, '/api/services/freeCompute')
      ? super.getEndpointURL(serviceEndpoints, '/api/services/freeCompute').urlPath
      : null

    if (computeEnv.indexOf("-free") === -1) {
      computeStartUrl = super.getEndpointURL(serviceEndpoints, 'computeStart')
        ? super.getEndpointURL(serviceEndpoints, 'computeStart').urlPath
        : null
    }

    const consumerAddress = await consumer.getAddress()
    const nonce = (
      (await super.getNonce(
        providerUri,
        consumerAddress,
        signal,
        providerEndpoints,
        serviceEndpoints
      )) + 1
    ).toString()

    let signatureMessage = consumerAddress
    signatureMessage += dataset.documentId
    signatureMessage += nonce
    const signature = await super.signProviderRequest(consumer, signatureMessage)
    const payload = Object()
    payload.consumerAddress = consumerAddress
    payload.signature = signature
    payload.nonce = nonce
    payload.environment = computeEnv
    payload.datasets = [dataset]
    payload.algorithm = algorithm
    if (additionalDatasets) payload.additionalDatasets = additionalDatasets
    if (output) payload.output = output
    if (!computeStartUrl) return null
    let response
    try {
      response = await fetch(computeStartUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        signal
      })
    } catch (e) {
      LoggerInstance.error('Compute start failed:')
      LoggerInstance.error(e)
      LoggerInstance.error('Payload was:', payload)
      throw new Error('HTTP request failed calling Provider')
    }
    if (response?.ok) {
      const params = await response.json()
      return params
    }
    LoggerInstance.error(
      'Compute start failed: ',
      response.status,
      response.statusText,
      await response.json()
    )
    LoggerInstance.error('Payload was:', payload)
    return null
  }

}

export const CustomProviderInstance = new CustomProvider()