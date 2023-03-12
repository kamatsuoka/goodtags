import {AppDispatch, RootState} from "../store"

export type ThunkApiConfig = {
  dispatch: AppDispatch
  state: RootState
  rejectValue: string
}
