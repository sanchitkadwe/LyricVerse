import torch
import io
import warnings
from django.core.files.base import ContentFile
warnings.filterwarnings('ignore')

try:
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer
    import soundfile as sf
except ImportError:
    ParlerTTSForConditionalGeneration = None
    AutoTokenizer = None
    sf = None

device = "cuda" if torch.cuda.is_available() else "cpu"

model = None
tokenizer = None
description_tokenizer = None

def load_model():
    global model, tokenizer, description_tokenizer
    if (model is not None) or (ParlerTTSForConditionalGeneration is None):
        return
    model_path = "ai4bharat/indic-parler-tts"
    try:
        model = ParlerTTSForConditionalGeneration.from_pretrained(model_path).to(device)
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
        print("Successfully loaded ParlerTTS model")
    except Exception as e:
        print(f"Failed to load TTS model: {e}")

# Call it safely
load_model()


def generate_tts_audio(prompt_text):
    if not model or not tokenizer or not description_tokenizer:
        raise Exception("Model is not initialized or libraries are missing. Cannot generate TTS.")
    
    description = "A female speaker speaks with a clear, cheerful voice and moderate pace. As if she is singing a song"
    
    prompt_inputs = tokenizer(prompt_text, return_tensors="pt").to(device)
    desc_inputs = description_tokenizer(description, return_tensors="pt").to(device)
    
    outputs = model.generate(
        input_ids=desc_inputs.input_ids,
        attention_mask=desc_inputs.attention_mask,
        prompt_input_ids=prompt_inputs.input_ids,
        prompt_attention_mask=prompt_inputs.attention_mask
    )
    
    audio_array = outputs.cpu().numpy().squeeze()
    
    buffer = io.BytesIO()
    sf.write(buffer, audio_array, samplerate=model.config.sampling_rate, format='wav')
    
    return ContentFile(buffer.getvalue(), name="tts_generated.wav")
