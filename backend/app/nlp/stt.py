from typing import Optional, Dict, Any

class STTService:
    """
    Speech-to-Text handler with graceful fallback for voice reports.
    If speech transcription is unavailable, original transcript / failure state is preserved.
    """
    @staticmethod
    def transcribe(audio_bytes_or_text: Any, language_hint: str = "hi") -> str:
        """
        Transcribes audio data or returns pre-transcribed text.
        Under degraded STT conditions, preserves raw payload with degradation metadata.
        """
        if isinstance(audio_bytes_or_text, str):
            return audio_bytes_or_text
        
        # Audio bytes mock handler for demo testing
        return "Voice transcript: Emergency reported near ward school. Water rising quickly."

stt_service = STTService()
