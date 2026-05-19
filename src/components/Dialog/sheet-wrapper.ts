import {useCallback} from 'react'
import {SystemBars} from 'react-native-edge-to-edge'

/**
 * If we're calling a system API like the image picker that opens a sheet
 * wrap it in this function to make sure the status bar is the correct color.
 */
export function useSheetWrapper() {
  return useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    return await promise
  }, [])
}
