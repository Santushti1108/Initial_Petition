import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from analyzer.petition_analyzer import analyze_petition

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max


def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'NyayaLens API is running'})


@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            file.save(tmp.name)
            text = extract_text_from_pdf(tmp.name)
            os.unlink(tmp.name)

        if not text or len(text.strip()) < 50:
            return jsonify({
                'error': 'Could not extract meaningful text from the PDF. The file may be scanned/image-based or corrupted.'
            }), 400

        result = analyze_petition(text)

        if 'error' in result:
            return jsonify(result), 400

        result['raw_text_preview'] = text[:500] + ('...' if len(text) > 500 else '')

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']
    if len(text.strip()) < 50:
        return jsonify({'error': 'Text is too short for meaningful analysis'}), 400

    try:
        result = analyze_petition(text)
        if 'error' in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
