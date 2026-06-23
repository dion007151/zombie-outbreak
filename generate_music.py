import wave
import math
import struct
import random

def generate_horror_track(filename="music.mp4a", duration=60):
    sample_rate = 44100
    num_samples = duration * sample_rate
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = float(i) / sample_rate
            
            # Low drone
            drone = math.sin(2 * math.pi * 50 * t) * 0.4
            
            # Eerie dissonance
            diss = math.sin(2 * math.pi * 53 * t) * 0.3
            
            # Slow pulse
            pulse = math.sin(2 * math.pi * 0.5 * t)
            
            # Occasional noise
            noise = (random.random() * 2 - 1) * 0.05
            
            value = (drone + diss) * pulse + noise
            value *= 32767
            value = max(-32768, min(32767, value)) # clip
            
            data = struct.pack('<h', int(value))
            wav_file.writeframesraw(data)

generate_horror_track()
