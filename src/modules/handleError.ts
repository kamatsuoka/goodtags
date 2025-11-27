export async function handleError(error: any, action: string) {
  let msg: string = 'unknown error'
  if (error) {
    if (typeof error === 'object' && 'message' in error)
      msg = error.message as string
    else msg = JSON.stringify(error, null, 2)
  }
  console.error(`error in ${action}`, msg)
  return msg
}
