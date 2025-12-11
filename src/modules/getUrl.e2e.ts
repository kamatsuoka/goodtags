import { PopularSearchParams } from '@app/modules/popularSlice'
import { AxiosRequestConfig } from 'axios'
import { popularXml } from './__mocks__/popular.xml'

/**
 * Mock for detox end-to-end testing
 */
export default async function getUrl<T = string>(
  baseUrl: string,
  config?: AxiosRequestConfig<any>,
): Promise<T> {
  console.debug(`getUrl.e2e: baseUrl=${baseUrl}, config = ${JSON.stringify(config)}`)
  if (config?.params === PopularSearchParams) {
    return popularXml as T
  }
  // TODO: support search
  const emptySearch =
    '<?xml version="1.0" encoding="iso-8859-1" ?>' +
    '<tags available="5180" count="0" stamp="2022-12-31 19:20:54"></tags>'
  return emptySearch as T
}
