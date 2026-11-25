# Question Bank Data Format

This directory stores subject configurations and static question banks separately from all UI components.

## Adding or Replacing Questions from PDFs

When extracting questions from university exam PDFs:
1. Preserve the **exact original question wording**, **options (A–D)**, and **answer key**.
2. Never invent questions, rewrite options, or guess an answer key.
3. If a question or answer key in the PDF is unclear, illegible, or missing, set:
   - `"correctAnswer": null`
   - `"needsVerification": true`
   - `"verificationNote": "Explain why manual verification is needed"`

## JSON Schema

```json
[
  {
    "id": "subject-01-q001",
    "subjectId": "subject-01",
    "text": "Exact question text from the PDF.",
    "imageUrl": "/images/subject-01/q001.png",
    "imageAlt": "Optional description of the figure",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "B",
    "explanation": "Optional explanation from the answer key.",
    "source": {
      "fileName": "UAS-2025.pdf",
      "page": 3,
      "originalNumber": 1
    },
    "needsVerification": false
  }
]
```

You can either replace `src/data/questions/subject-01.json` / `subject-02.json` directly, or import a JSON file for any subject from **Settings -> Import Question Bank**.
