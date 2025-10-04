from flask import Flask, render_template, request
from deep_translator import GoogleTranslator

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json()
    text = data.get("text")
    src = data.get("source_lang", "en")
    dest = data.get("target_lang", "en")
    try:
        translated = GoogleTranslator(source=src, target=dest).translate(text)
        return {'translated_text': translated, 'original_text': text}
    except Exception as e:
        return {'error': str(e)}

@app.route('/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get("text", "")
    words = text.split()
    summary = " ".join(words[:50]) + ("..." if len(words) > 50 else "")
    return {'summary_text': summary}

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
