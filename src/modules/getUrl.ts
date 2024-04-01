import axios, {AxiosRequestConfig} from "axios"

export default async function getUrl<T = string>(
  baseUrl: string,
  config: AxiosRequestConfig<any> = {},
): Promise<T> {
  const configDebugString = JSON.stringify(config)
  console.debug(`getUrl: baseUrl=${baseUrl}, config = ${configDebugString}`)
  const response = await axios.get(baseUrl, config)
  if (response.status !== 200) {
    // TODO: store debugging log
    const msg =
      response.statusText ||
      `${response.status}` ||
      `got undefined status from ${response.request.url} ` +
        `with config ${configDebugString}`
    throw Error(msg)
  }
  return response.data
}
