import { AppDispatch, RootState } from '@app/store'

export type ThunkApiConfig = {
  dispatch: AppDispatch
  state: RootState
  rejectValue: string
}
