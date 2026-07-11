import {Platform, Vibration} from 'react-native';
import Sound from 'react-native-sound';

let ringtone: Sound | null = null;
let isPlaying = false;

Sound.setCategory('Playback', true);

export function startIncomingRingtone() {
  if (isPlaying) {
    return;
  }
  isPlaying = true;

  if (Platform.OS === 'android') {
    if (!ringtone) {
      ringtone = new Sound('incoming_ring.mp3', Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.warn('Ringtone load failed:', error);
          Vibration.vibrate([0, 800, 400, 800], true);
          return;
        }
        ringtone?.setNumberOfLoops(-1);
        ringtone?.play();
      });
    } else {
      ringtone.setNumberOfLoops(-1);
      ringtone.play();
    }
  } else {
    Vibration.vibrate([0, 800, 400, 800], true);
  }
}

export function stopIncomingRingtone() {
  isPlaying = false;
  Vibration.cancel();
  if (ringtone) {
    ringtone.stop();
  }
}

export function releaseIncomingRingtone() {
  stopIncomingRingtone();
  if (ringtone) {
    ringtone.release();
    ringtone = null;
  }
}
