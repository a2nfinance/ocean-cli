import {
    MetadataAlgorithm
} from "@oceanprotocol/lib";

export interface BaseFileObject {
    type: string

}

export interface UrlFileObject extends BaseFileObject {
    url: string
    method: string
}

export interface IpfsFileObject extends BaseFileObject {
    hash: string
}
export interface CustomComputeAsset{
    fileObject?: BaseFileObject,
    documentId: string
    serviceId: string
    transferTxId?: string
    userdata?: { [key: string]: any }
}

export interface CustomComputeAlgorithm {
    fileObject?: BaseFileObject,
    documentId?: string
    serviceId?: string
    meta?: MetadataAlgorithm
    transferTxId?: string
    algocustomdata?: { [key: string]: any }
    userdata?: { [key: string]: any }
}
