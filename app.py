from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Backend is running!"


@app.route("/upload", methods=["POST"])
def upload_pdf():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    full_text = ""

    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not full_text.strip():
        return jsonify({"error": "No readable text found"}), 400

    lines = full_text.split("\n")

    structured_data = {}
    current_heading = "Main Topic"
    structured_data[current_heading] = []

    for line in lines:
        clean = line.strip()
        if not clean:
            continue

        if (
            len(clean) < 60
            and clean[0].isupper()
            and not clean.endswith(".")
        ):
            current_heading = clean
            structured_data[current_heading] = []
            continue

        if 20 < len(clean) < 200:
            structured_data[current_heading].append(clean)

    for key in structured_data:
        structured_data[key] = structured_data[key][:6]

    return jsonify({"Mindmap": structured_data})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)