import sounddevice as sd
import numpy as np

def get_audio_sample(duration=2, fs=16000):
    print('Recording audio...')
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()
    return np.squeeze(audio)

if __name__ == '__main__':
    sample = get_audio_sample()
    print('Audio sample shape:', sample.shape)