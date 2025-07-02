# Sahayak &nbsp;![MIT License](https://img.shields.io/github/license/Muneerali199/sahayak?color=green) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Issues](https://img.shields.io/github/issues/Muneerali199/sahayak) ![Last Commit](https://img.shields.io/github/last-commit/Muneerali199/sahayak)

> **Sahayak** is an **AI-powered teaching assistant** designed to empower teachers in multi-grade, low-resource classrooms. It helps educators effortlessly create localized content, differentiated worksheets, and visual aids in regional languages—reducing workload and enhancing student learning.

---

## 🚀 Project Overview

**Sahayak** leverages the power of modern AI and intuitive web interfaces to address the unique needs of diverse classrooms, especially where resources and time are limited. By supporting teachers in content creation and classroom management, Sahayak bridges the gap between technology and grassroots education.

- **Localized Content:** Generate teaching materials in multiple regional languages.
- **Differentiated Worksheets:** Tailor assignments for students at varying learning levels.
- **Visual Aids:** Easily create charts, flashcards, and more—no design skills required.
- **User-Friendly:** Minimal setup, accessible UI, and seamless workflow.

---

## 🏆 Hackathon & Team

This project was created as part of the **Google Cloud Agentic Hackathon**.

**Team Blitz**
- **Muneer Ali**
- **Aditya**
- **Prachi**
- **Ashwini**
- **Ayush**

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Python (FastAPI), Pandas

---

## 📁 Project Structure

```
sahayak/
├── backend/                  
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   ├── data/                  # AI, worksheet, and PDF generation logic dataasts
│   ├── .env.local
│   ├── models/                # Pydantic models and schemas
│   └── ...                    
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI components
│   │   ├── services/          # API calls
│   │   ├── assets/            # Images, icons need to be add etc.
│   │   ├── App.tsx            # React root component
│   │   └── main.tsx           # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── ...                    
├── docs/
│   └── screenshots/           # App screenshots
├── .github/
│   └── workflows/             # GitHub Actions CI/CD configs
├── .gitignore
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

---

## 📥 Installation

**Requirements:**  
- [Node.js](https://nodejs.org/) (v18+ recommended)  
- [Python 3.9+](https://www.python.org/downloads/)  
- [pip](https://pip.pypa.io/en/stable/)

#### 1. Clone the Repository

```bash
git clone https://github.com/Muneerali199/sahayak.git
cd sahayak
```

#### 2. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 3. Setup Frontend

Open a new terminal tab/window:

```bash
cd frontend
npm install
npm run dev
```

#### 4. Access the App

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend API: [http://localhost:8000](http://localhost:8000)

---

## 💡 Usage

1. **Login or Start as Guest.**
2. **Select Language** and grade level.
3. **Generate Content:**  
   - Enter a topic or concept.
   - Choose worksheet or visual aid type.
   - Click "Generate" to receive instant, localized teaching materials.
4. **Download, print, or share** the generated resources.

### Example Workflow

- Select "Grade 5 Mathematics", language "Hindi".
- Enter topic: "Fractions".
- Receive:  
  - Custom worksheet PDF  
  - Flashcards  
  - Visual explanation images

---

## ✨ Features

- **AI-Driven Content Creation:** Smart, curriculum-aligned resources.
- **Regional Language Support:** Multiple Indian languages out of the box.
- **Differentiation:** Materials are tailored for various student ability levels.
- **Data Privacy:** No student data stored without explicit consent.
- **Open Source:** Easily extensible for new languages or features.

---

## 📸 Screenshots

<!-- Replace the below with actual images if available -->
| Worksheet Generator | Visual Aid Example |
|--------------------|------------------|
| ![Screenshot 1](docs/screenshots/worksheet.png) | ![Screenshot 2](docs/screenshots/visual-aid.png) |

---

## 🤝 Contributing

We welcome contributions! Please:

1. **Fork** the repo and create your branch: `git checkout -b feature/your-feature`
2. **Commit** your changes: `git commit -am 'Add some feature'`
3. **Push** to the branch: `git push origin feature/your-feature`
4. **Open a Pull Request**

**Reporting Issues:**  
- Use the [issues tab](https://github.com/Muneerali199/sahayak/issues).
- Provide as much detail as possible: steps to reproduce, expected/actual behavior, and screenshots if applicable.

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

- Inspired by the needs of grassroots educators across India.
- Powered by open source and the generosity of contributors like you!
- Created as a part of the **Google Cloud Agentic Hackathon** by **Team Blitz**  
  (Muneer Ali, Aditya, Prachi, Ashwini, Ayush)

---

> _Empowering teachers. Enriching classrooms. Enabling every child to learn._