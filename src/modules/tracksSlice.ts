/**
 * Keeps track of playing learning tracks.
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import Tag, { Track, TrackPart } from '../lib/models/Tag'
import { AppDispatch, RootState } from '../store'

// Global audio player for learning tracks
let trackPlayer: AudioPlayer | null = null

function getTrackPlayer(): AudioPlayer {
  if (!trackPlayer) {
    trackPlayer = createAudioPlayer()
  }
  return trackPlayer
}

type TagTracks = {
  [key in TrackPart]?: Track
}

export enum PlayingState {
  idle = 'idle',
  playing = 'playing',
  paused = 'paused',
  ended = 'ended',
}

export interface TracksState {
  selectedPart: TrackPart
  tagTracks: TagTracks
  playingState: PlayingState
  selectedTrack?: Track
}

export const initialState: TracksState = {
  selectedPart: TrackPart.AllParts,
  tagTracks: {},
  playingState: PlayingState.idle,
}

/**
 * Gets the to play based on the selected part,
 * falling back to All Parts if available, or the first track in the list.
 */
export function getSelectedTrack(
  tagTracks: TagTracks,
  selectedPart: TrackPart,
): Track | undefined {
  if (tagTracks && Object.entries(tagTracks).length > 0) {
    if (selectedPart && tagTracks[selectedPart]) {
      return tagTracks[selectedPart]
    }
    return tagTracks[TrackPart.AllParts] || Object.entries(tagTracks)[0][1]
  }
  return undefined
}

export const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setTagTracks: (state, action: PayloadAction<Tag>) => {
      const tracks = action.payload.tracks || []
      const map = new Map(tracks.map(track => [track.part, track]))
      state.tagTracks = Object.fromEntries(map)
      state.playingState = PlayingState.idle
      state.selectedTrack = getSelectedTrack(
        state.tagTracks,
        state.selectedPart,
      )
    },
    setSelectedPart: (state, action: PayloadAction<TrackPart>) => {
      state.selectedPart = action.payload
      state.selectedTrack = getSelectedTrack(
        state.tagTracks,
        state.selectedPart,
      )
    },
    setPlayingState: (state, action: PayloadAction<PlayingState>) => {
      state.playingState = action.payload
    },
  },
})

export const playTrack = createAsyncThunk<
  void,
  boolean,
  {
    dispatch: AppDispatch
    state: RootState
    rejectValue: string
  }
>('tracks/playTrack', async (fromStart: boolean, thunkAPI) => {
  const state = thunkAPI.getState()
  const track = state.tracks.selectedTrack
  if (track) {
    const player = getTrackPlayer()
    if (fromStart || state.tracks.playingState !== PlayingState.paused) {
      // Replace current audio source and play
      player.replace(track.url)
      player.play()
    } else {
      // Resume from pause
      player.play()
    }
    thunkAPI.dispatch(setPlayingState(PlayingState.playing))
  }
})

export const playOrPause = createAsyncThunk<
  void,
  void,
  {
    dispatch: AppDispatch
    state: RootState
    rejectValue: string
  }
>('tracks/playOrPause', async (_, thunkAPI) => {
  const state = thunkAPI.getState()
  const track = state.tracks.selectedTrack
  if (track) {
    const player = getTrackPlayer()
    if (state.tracks.playingState === PlayingState.playing) {
      player.pause()
      thunkAPI.dispatch(setPlayingState(PlayingState.paused))
    } else {
      thunkAPI.dispatch(playTrack(false))
    }
  }
})

export const stopTrack = createAsyncThunk<
  void,
  void,
  {
    dispatch: AppDispatch
    state: RootState
    rejectValue: string
  }
>('tracks/stopTrack', async (_, thunkAPI) => {
  if (trackPlayer) {
    trackPlayer.pause()
  }
  thunkAPI.dispatch(setPlayingState(PlayingState.ended))
})

export const { setTagTracks, setSelectedPart, setPlayingState } =
  tracksSlice.actions

export default tracksSlice.reducer
